import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PriceItem, PricesFile } from '../src/lib/market/zenon-prices';

/**
 * fetch-prices — derives ZNN/QSR sats, ETH, and USD prices from on-chain
 * Uniswap pool data.
 *
 * Price chain (fully on-chain, no third-party APIs):
 *   1. wZNN/WETH Uniswap V2 pool  → getReserves() → ETH per ZNN
 *   2. WBTC/WETH Uniswap V3 pool  → slot0()       → ETH per BTC
 *   3. ZNN_sats = (ETH_per_ZNN / ETH_per_BTC) * 1e8
 *   4. wQSR/wZNN Uniswap V2 pool  → getReserves() → ZNN per QSR
 *   5. QSR_sats = ZNN_sats * (ZNN per QSR)
 *   6. USDC/WETH Uniswap V3 pool  → slot0()       → USD per ETH
 *   7. Asset USD = asset ETH * USD per ETH
 *
 * Usage:
 *   npx tsx scripts/fetch-prices.ts
 *   ETH_RPC_URL=https://mainnet.infura.io/v3/<key> npx tsx scripts/fetch-prices.ts
 */

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = path.resolve(SCRIPT_DIR, '../public/prices.json');

// Pools
const WZNN_WETH_V2_POOL = '0xdac866a3796f85cb84a914d98faec052e3b5596d'; // Uniswap V2 wZNN/WETH
const WBTC_WETH_V3_POOL = '0x4585fe77225b41b697c938b018e2ac67ac5a20c0'; // Uniswap V3 WBTC/WETH 0.05%
const WQSR_WZNN_V2_POOL = '0xe6c61425d0383c1cde02a49365945f48ebf0ea0c'; // Uniswap V2 wQSR/wZNN (token0=wQSR, token1=wZNN)
const USDC_WETH_V3_POOL = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'; // Uniswap V3 USDC/WETH 0.05%

// Token decimals (on Ethereum mainnet)
const WQSR_DECIMALS = 8;
const WZNN_DECIMALS = 8;
const WBTC_DECIMALS = 8;
const WETH_DECIMALS = 18;
const USDC_DECIMALS = 6;

// WETH address for determining V3 pool token order
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

// ABI function selectors
const SEL_GET_RESERVES = '0x0902f1ac'; // getReserves() — Uniswap V2
const SEL_SLOT0        = '0x3850c7bd'; // slot0()       — Uniswap V3
const SEL_TOKEN0       = '0x0dfe1681'; // token0()

const DEFAULT_RPC = 'https://ethereum-rpc.publicnode.com';

// --- RPC helpers ---

async function ethCall(rpc: string, to: string, data: string): Promise<string> {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = (await res.json()) as { result?: string; error?: { message: string } };
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  if (!json.result || json.result === '0x') throw new Error(`Empty RPC result for ${to}`);
  return json.result;
}

function roundPrice(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// --- Uniswap V2: getReserves() ---

/** Returns ETH per ZNN from a wZNN/WETH V2 pool (token0=wZNN, token1=WETH). */
async function ethPerZnnFromV2(rpc: string): Promise<number> {
  const result = await ethCall(rpc, WZNN_WETH_V2_POOL, SEL_GET_RESERVES);
  const hex = result.slice(2); // strip 0x
  const reserve0 = BigInt('0x' + hex.slice(0, 64)); // wZNN raw units
  const reserve1 = BigInt('0x' + hex.slice(64, 128));  // WETH raw units

  const znn = Number(reserve0) / 10 ** WZNN_DECIMALS;
  const eth = Number(reserve1) / 10 ** WETH_DECIMALS;
  return eth / znn;
}

/** Returns ZNN per QSR from a wQSR/wZNN V2 pool (token0=wQSR, token1=wZNN). */
async function znnPerQsrFromV2(rpc: string): Promise<number> {
  const result = await ethCall(rpc, WQSR_WZNN_V2_POOL, SEL_GET_RESERVES);
  const hex = result.slice(2); // strip 0x
  const reserve0 = BigInt('0x' + hex.slice(0, 64)); // wQSR raw units
  const reserve1 = BigInt('0x' + hex.slice(64, 128)); // wZNN raw units

  const qsr = Number(reserve0) / 10 ** WQSR_DECIMALS;
  const znn = Number(reserve1) / 10 ** WZNN_DECIMALS;
  return znn / qsr;
}

// --- Uniswap V3: slot0() ---

function scaledV3Token1PerToken0(sqrtPriceX96: bigint, token0Decimals: number, token1Decimals: number): number {
  const SCALE = 10n ** 18n;
  const Q192 = 2n ** 192n;
  const decimalAdjust = 10n ** BigInt(token0Decimals);
  const divisorAdjust = 10n ** BigInt(token1Decimals);
  const scaled = (sqrtPriceX96 * sqrtPriceX96 * decimalAdjust * SCALE) / (Q192 * divisorAdjust);
  return Number(scaled) / 1e18;
}

/**
 * Returns ETH per BTC from the WBTC/WETH V3 pool.
 * Handles both token orderings by checking which is WETH.
 */
async function ethPerBtcFromV3(rpc: string): Promise<number> {
  const [token0Res, slot0Res] = await Promise.all([
    ethCall(rpc, WBTC_WETH_V3_POOL, SEL_TOKEN0),
    ethCall(rpc, WBTC_WETH_V3_POOL, SEL_SLOT0),
  ]);

  const token0 = ('0x' + token0Res.slice(-40)).toLowerCase();
  const sqrtPriceX96 = BigInt('0x' + slot0Res.slice(2, 66)); // first 32 bytes

  const token0IsWeth = token0 === WETH_ADDRESS;
  const token1PerToken0 = scaledV3Token1PerToken0(sqrtPriceX96, WBTC_DECIMALS, WETH_DECIMALS);

  if (token0IsWeth) {
    const wbtcPerEth = token1PerToken0;
    return 1 / wbtcPerEth;
  } else {
    return token1PerToken0;
  }
}

/** Returns USD per ETH from the USDC/WETH V3 pool. */
async function usdPerEthFromV3(rpc: string): Promise<number> {
  const [token0Res, slot0Res] = await Promise.all([
    ethCall(rpc, USDC_WETH_V3_POOL, SEL_TOKEN0),
    ethCall(rpc, USDC_WETH_V3_POOL, SEL_SLOT0),
  ]);

  const token0 = ('0x' + token0Res.slice(-40)).toLowerCase();
  const sqrtPriceX96 = BigInt('0x' + slot0Res.slice(2, 66));
  const token0IsWeth = token0 === WETH_ADDRESS;
  const token1PerToken0 = scaledV3Token1PerToken0(sqrtPriceX96, USDC_DECIMALS, WETH_DECIMALS);

  if (token0IsWeth) {
    const usdcPerEth = token1PerToken0;
    return usdcPerEth;
  }

  const ethPerUsdc = token1PerToken0;
  return 1 / ethPerUsdc;
}

// --- Main ---

async function main(): Promise<void> {
  const rpc     = process.env.ETH_RPC_URL ?? DEFAULT_RPC;
  const outPath = path.resolve(process.env.PRICES_OUT ?? DEFAULT_OUT);

  console.log(`Fetching prices via ${rpc}`);

  const [ethPerZnn, ethPerBtc, usdPerEth] = await Promise.all([
    ethPerZnnFromV2(rpc),
    ethPerBtcFromV3(rpc),
    usdPerEthFromV3(rpc),
  ]);

  const znnSats = Math.round((ethPerZnn / ethPerBtc) * 1e8);
  const znnPerQsr = await znnPerQsrFromV2(rpc);
  const qsrSats = Math.round(znnSats * znnPerQsr);
  const ethPerQsr = ethPerZnn * znnPerQsr;
  const znnUsd = ethPerZnn * usdPerEth;
  const qsrUsd = ethPerQsr * usdPerEth;

  console.log(`ETH/ZNN:  ${ethPerZnn.toExponential(4)}`);
  console.log(`ETH/BTC:  ${ethPerBtc.toFixed(4)}`);
  console.log(`USD/ETH:  ${usdPerEth.toFixed(2)}`);
  console.log(`ZNN sats: ${znnSats}`);
  console.log(`ZNN/QSR:  ${znnPerQsr.toFixed(6)}`);
  console.log(`QSR sats: ${qsrSats}`);

  const items: PriceItem[] = [
    { symbol: 'ZNN', sats: znnSats, eth: roundPrice(ethPerZnn, 12), usd: roundPrice(znnUsd, 8) },
    { symbol: 'QSR', sats: qsrSats, eth: roundPrice(ethPerQsr, 12), usd: roundPrice(qsrUsd, 8) },
  ];
  const output: PricesFile = {
    updatedAt: new Date().toISOString(),
    ethUsd: roundPrice(usdPerEth, 4),
    items,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  const tmp = `${outPath}.tmp`;
  await writeFile(tmp, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  await rename(tmp, outPath);

  console.log(`Wrote → ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
