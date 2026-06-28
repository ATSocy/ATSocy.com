---
title: Zenon Network Quarterly Update Q4 2024
description: >-
  We’ve talked about the Sleeping Giant before. Now it looks less like sleep and
  more like a coma. Does it still show any signs of brain activity?
pubDate: '2025-01-20'
updatedDate: '2025-01-20'
draft: false
tags:
  - zenon-network
  - zenon
canonicalUrl: 'https://atsocy.com/zenon-network-quarterly-update-q4-2024'
heroImage: ./1d2f9af7-fbfa-4710-b2ae-0deb7b650a87.png
heroImageAlt: Zenon Network Quarterly Update Q4 2024
nostrEventId: 2bae1a9f5346688e814c31586227d0e40fe7d6851ee417325b212ec66d05130e
---
## The Coma-Induced Giant

We’ve talked about the **Sleeping Giant** before. Now it looks less like sleep and more like a coma. Does it still show any signs of brain activity? Instead of speculation, let's measure something tangible: progress, updates, commits, new alts, etc.

If the readouts are flat, we face that reality. If there's a pulse, we keep pushing. If it's dead...

...we wait for the **Chestburster** to emerge from the host giant

**TLDR**: NGMI + HFSP.

*For those not versed in alien shorthand, that's 'Not Gonna Make It' and 'Have Fun Staying Poor.'*

## So, what should aliens measure?

Honestly, we’re not sure. There’s no fancy funnel-tracking here, just a few raw numbers we can revisit next quarter. Let’s note them down:

* **X (**[**@Zenon\_Network**](https://x.com/zenon_network)**)**: 13.4K followers
    
* [**Discord**](https://discord.gg/8TvWx4HdXS): 888 members
    
* **Telegram (**[**Main**](https://t.me/zenonnetwork)**)**: 2,865 members
    
* **Telegram (**[**Community**](https://t.me/zenonofficial)**)**: 321 members
    
* **Reddit** ([r/Zenon\_Network](https://www.reddit.com/r/Zenon_Network/)): 570 members
    
* **Alien as F\*** ([X Spaces](https://x.com/i/spaces/1ynKODyoEOWGR)): 712 listeners
    

We’ll keep one eye on those to see if anything spikes or flatlines. If you want these channels to grow, send your referrals there, and encourage constructive discussions while you’re at it.

You only have to **read an update every quarter** to make it.

*Commentary from the ATS is in italics.*

Let’s roll.

3... 2... 1...

## Network of Momentum Updates

### Three-Year NoM Anniversary

November 24, 2024, marked the third anniversary of the Alphanet Big Bang. It’s been three years since the genesis event of the Network of Momentum, during which over 9 million momentums have been produced with an impressive 0% downtime, a milestone we should all be proud of.

Time truly flies when you’re surrounded by hardcore aliens.

### Syrius Mobile Wallet

The wallet is moving along nicely. A big requirement for app store listing is a **website** and a **support forum**. Tortcher submitted an [Accelerator-Z proposal](https://forum.zenon.org/t/az-syrius-wallet-website-needed-for-ios-android-submission/1977/4) to tackle:

1. The design and deployment of the website.
    
2. Help with automated builds for Apple/Google app stores.
    

Tentative release date is April 1st, 2025. *We refuse to confirm if it’s a joke.*

### ZNN Listing on Non-KYC

Thanks to a dedicated community effort, Zenon has achieved its second CEX listing for native ZNN. **Nonkyc.io** now offers a ZNN/USDT market. With this, Zenon is available across three markets:

1. **Uniswap (ETH)** as wZNN
    
2. **Xeggex** as native ZNN
    
3. **Nonkyc** as native ZNN
    

![Image](/images/posts/zenon-network-quarterly-update-q4-2024/ggs3lacwgaa2nvu.jpg)

### Multichain Bridge: BNB Chain Support

The HyperCore Team have added BNB Chain support to the bridge. The NoM &lt;-&gt; wZNN bridge for **BNB Chain** is live under a [fresh contract address](https://bscscan.com/address/0xce20573c4b96883257319b706c06b7e1cb80f2d8), rendering the previous one “[deprecated](https://forum.zenon.org/t/deprecation-plan-for-legacy-wznn/1686)”. BNB Chain could open doors for bridging to Solana, Base, etc. through a [Wormhole](https://wormhole.com) integration.

### Alien as F\*: Weekly Community Call on Fridays

This effort to engage the Community technically launched in Q1 2025 on January 17th, but we’re claiming it as Q4 2024, because the idea was probably brewing since September, anyway. This X Spaces is designed for aliens to connect, share and evolve together.

Missed it? Don’t worry. Join the next one Jan 24th, 2025 at 4 PM UTC.

![](/images/posts/zenon-network-quarterly-update-q4-2024/4a354470-1d44-41a5-88a3-b75691ed2085.png)

### HyperQube Testnet

The HyperQube testnet is done. It worked flawlessly. Now everyone’s waiting for the launch date. If you know a Pillar operator, tell them to pay attention. This is their moment to either run a HQZ pillar or delegate it to another person!

### Supernova Temporary Halt

The Zenon Supernova extension chain experienced a temporary halt after falling below the required consensus threshold of online Pillars. As a result, the orchestrators powering the bridge also halted, triggered by an unhandled exception caused by offline Supernova nodes.

Support for Supernova was quickly removed from the bridge to restore functionality. Significant effort was invested in bringing Supernova back online. Now, the chain is more stable, constantly monitored, and the multi-chain bridge has been reactivated.

### Phase Zzz

Still snoozing. Possibly. Possibly not. Placeholder for big reveals or big shrugs.

---

## Development Updates

To keep things concise, any items from the previous quarterly update that haven't received significant updates remain works in progress.

### Performance Improvements to Go Live on HyperQube Z

The `go-zenon` optimizations highlighted in the [last update](https://www.atsocy.com/zenon-network-quarterly-update-q3-2024#heading-node-optimizations-and-stability-improvements) are scheduled to roll out alongside the launch of HyperQube Z. The focus is on rapid development and iteration, so developers expect occasional breaks in the HyperQube Z chain as updates are pushed fast and often.

### Governance Module Proposed Implementation

**Proposed by @sumoshi21**, the new governance module aims to make Zenon’s network governance more flexible and decentralized by integrating an **embedded contract**. This module addresses two core challenges:

1. **Network Upgrades (Sporks):** Allows Pillars to create and activate sporks via governance, eliminating the need for hardcoded mechanisms.
    
2. **Parameter Changes:** Enables governance-driven updates to critical network parameters, such as bridge settings and liquidity contracts, previously reserved for centralized admins.
    

**Key Features:**

* A **1 ZNN fee** is required to create a proposal as an anti-spam measure.
    
* Proposals are subject to voting by Pillars, with two types:
    
    * **Type 1:** For sporks, requiring 66%+1 quorum and a 45-day voting period.
        
    * **Type 2:** For other changes, requiring 50%+1 quorum and a 30-day voting period.
        
* Governance proposals interact directly with other embedded contracts, enabling tasks like network upgrades, parameter adjustments, and bridge administration.
    
* ![](/images/posts/zenon-network-quarterly-update-q4-2024/bd799de4-39f4-40ae-9399-88448c6c6f44.png)
    

**Implementation Notes:**

* The governance module defines specific methods (e.g., `CreateSporkMethod`, `SetNetworkMethod`, `ChangeAdministratorMethod`) to manage embedded contracts.
    
* **Dynamic quorum** was [discussed](https://forum.hypercore.one/t/universal-governance-module-proposal/544) but deemed risky due to potential abuse or unintended consequences.
    

**Next Steps:**

* Testing and iteration on the **HyperQube Network** before Alphanet deployment to ensure robustness.
    
* Additional ZIP (Zenon Improvement Proposal) documentation may be required to formalize the implementation and gather Pillar consensus.
    

The proposed implementation can be reviewed on GitHub: [go-zenon-governance](https://github.com/sumoshi21/go-zenon-governance).

### Supernova Bitcoin Account Abstraction (AA)

**Supernova**, Zenon’s first EVM extension-chain, bridges **Bitcoin’s ecosystem** with **DeFi innovation**. It allows users to sign transactions using **Bitcoin keys** through smart wallets deployed as **Solidity smart contracts**, which are **compiled and live on Zenon Supernova**. This ensures compatibility with popular Bitcoin wallets like **Xverse**.

**Key Features:**

* **P2SH**: Support for sending and receiving BTC
    
* **P2TR**: Support for sending and receiving BTC, Ordinals, and Runes
    
* **ECDSA** and **Schnorr** compatibility
    
* **Paymaster support** for gas fee handling
    

Supernova adheres to the **EIP-4337 specification**, enabling developers to seamlessly integrate Bitcoin with EVM capabilities. This fosters new opportunities for innovative applications, attracting broader adoption and unlocking DeFi potential for Bitcoin communities.

Checkout the [source code](https://github.com/AliensZone/supernova_account_abstraction) and play around with the [demo](https://coinselor.github.io/supernova_account_abstraction_demo/).

### Syrius Special Interest Group

The Syrius team has been steadily improving the wallet while laying the groundwork for future governance features. Discussions around the governance UI have started but are temporarily on hold as **John Maxwell** focuses on refactoring. A CLI implementation might be the first step to move things forward.

Significant progress has been made on the dashboard. The transfer tab was revamped with better UI/UX, optimized tests, and fixes for dependency issues. Challenges with handling DLLs and SO files during builds were resolved, making the process smoother overall.

Deep linking functionality also received attention. The Windows implementation was fixed, though issues on macOS remain. Documentation gaps were identified, but the updates ensure better link handling going forward. *Finally, we were getting tired of manually copying the WalletConnect URI to interact with applications.*

On the SDK side, **znn\_sdk\_dart v0.0.8** introduced improvements like `toJson` methods. Conflicts with **znn\_ledger\_dart** were resolved by updating it to **v0.0.6**, keeping the libraries in sync and ready for future features.

Minor bugs, like QR code issues, were flagged or resolved, contributing to a smoother user experience.

Looking ahead, once the dashboard updates are merged, the focus will shift to finalizing the transfer updates and improving deep linking. The governance UI will follow as the next priority. Syrius continues to evolve, with steady progress across the board.

Testing across macOS, Linux, and Windows involving the community will take place at a future date to ensure stability.

Follow the progress on GitHub: [Compare Master to Develop](https://github.com/zenon-network/syrius/compare/master...develop)

%[https://youtu.be/3ZudJTa28OQ] 

### Operations Special Interest Group

Throughout Q4, several meetings took place to discuss recent updates and observations for optimizing node operations and network performance:

* A **troubleshooting script** was deployed, tested, and is now in production.
    
* **Local backup and restore** functionality was submitted and is under revision.
    
* The `go-hyperqube` deployment tool was released, enabling easier hyperqube deployments using the `--deploy --hq` flags. [See the deployment script here](https://github.com/zenon-network/syrius/compare/master...develop).
    
* A **refactor and improved UI** for the deployment process are currently in development to simplify usage and enhance user experience.
    

![image.png](/images/posts/zenon-network-quarterly-update-q4-2024/jbykbqjkxnrnaasqfilmrisb.png)

* Performance testing highlighted challenges with slow sync speeds on VPS environments, such as Digital Ocean (e.g., 8vCPU/32GB RAM setups taking weeks to sync).
    
* LevelDB's single-threaded nature suggests that fewer but higher-performance cores are more effective than setups with many low-power cores.
    
* Early tests indicated that virtualization environments, particularly shared CPU plans, may contribute to slow sync speeds compared to bare metal or dedicated CPU setups.
    

---

## Ecosystem Updates

### BagSwap

The BagSwap team is making strong progress on its Decentralized Exchange. A second React developer, with experience in the PancakeSwap codebase, was hired to speed up development. The DEX refactor is advancing, with over half of the components ported and QA set to begin soon. Work on the Bridge framework is also underway, with milestones progressing steadily.

![](/images/posts/zenon-network-quarterly-update-q4-2024/62fbd2a6-6b4d-47a8-8dcc-ea58d6a2344f.png)

The **Orbital Program**, is the Liquidity Program designed to incentivize LP providers on the Zenon Network. The BagSwap Bridge front end will feature a UX prototyping for the complete flow, from bridging tokens to locking them on a Zenon embedded contract, with delivery planned for the end of Q1. The team remains focused on accelerating development cycles and ensuring scalability across platforms.

The Q1 2025 roadmap includes completing the DEX and Bridge refactors, while Q2 will shift to delivering mobile versions of the DEX and Bridge.

[Experiment with the UI](https://marvelapp.com/prototype/3310dd2g/screen/96398405), and provide feedback to [@mehowzbrainz](https://x.com/mehowbrainz/status/1871378795376369728)

For more information, follow [@BagSwap](https://x.com/bagswap).

### Weapymon

Something mysterious is brewing on the Zenon Network...

*Said no-one ever*

[**Weapymon**](https://x.com/weapymon), a project shrouded in mystery, has been dropping cryptic hints and tantalizing glimpses of what’s to come.

* **Player-Controlled Upgrades:** Upgrade your weapymon? or PP-Chan how you want because in weapymon, the **players are in control**.
    
* **Cute Characters and Battles:** The enigmatic "PP chan" has been teased in action, suggesting a fast-paced game action.
    
* **Intriguing Visuals:** With pixelated graphics and fast-paced animations, Weapymon feels like a retro-futuristic fusion of gameplay and customization.
    

We don’t know much yet, but the [transmissions have started](https://x.com/weapymon). Will you be ready to join the battle?

Stay tuned for updates from @[**Weapymon**](https://x.com/weapymon) as the adventure unfolds.

### Supernova Scan

A fully-featured fork of Blockscout is currently in development and expected to ship in Q1 2025. The explorer will be accessible at supernovascan.com.

### ALTzWTF

**A not-so-new alt** by the name of [ZNNBANYAMA](https://x.com/znnbanyama) decided to go into action. He/She/They revealed the **ALTz** project.

*Hard to tell what we like more: the play on the name of the NBA Alien Superstar WENBANYAMA, or the refences to the alts in our community*.

A reveal on [ALTz.WTF](http://altz.wtf) featuring a quirky, Game Boy–style mini-game stuffed with NoM references, and a secret quest inspired aliens to participate and support the movement.

The **vibe** is half cypherpunk revival, half alien LARP, topped with a side of genuine respect for Zenon. They claim that anyone who mints an ALTz NFT will make it. Hard to tell if that's marketing flair or they really mean it. Either way, keep your eyes peeled.

![](/images/posts/zenon-network-quarterly-update-q4-2024/1-3tioq-j8x2troiefx7bbta.gif)

**What we know so far**:

* Daily “CHALLENGEz” on [zealy.io](http://zealy.io/cw/altz), inviting you to “climb the leaderboard” for potential allowlist spots.
    
* A beautifully curated and colorful pixel art style feed with teases and memes.
    
* A community-first approach involving aliens in the creations of unique portraits and/or traits for the collection.
    
* GIVEAWAYz are taking place, an alien earned 123 $ZNN. *The ATS has independently verified the transaction.*
    

Unfortunately, the actual mint for ALTz is apparently on hold until further notice. According to them, a “[a chain with no user base](https://medium.com/@ALTz/altz-x-supernova-fd76b32852d2)” is the perfect stage for innovation. Let's hope the Zenon Supernova stability improvements and bridge support would be enough for builders to bridge and deploy contracts.

*If they actually pull off a successful mint under current circumstances, I wouldn't bet against them or the community they are building long term.*

---

## TMZNN

Most of you skip the Quarterly Update just to get to this section. *Sad, really sad.*

### Full Time G

The unstoppable dev known as George is pivoting from a boring 9-to-5 to a NoM-to-5. We truly appreciate his dedication. Let’s see if he can survive the rumored “monk tibetian rituals” needed to keep pace with Zenon’s madness.

### AZ Funds to Acquire Greenland

A very serious proposal from a wealthy Sultan: spend the entire Accelerator-Z treasury to buy Greenland. If that’s not enough, maybe half of Greenland. If you want your say, fire up Syrius and vote for/against the initiative.

*Let us not forget Zenocratez’s checklist for AZ asks*

![image](/images/posts/zenon-network-quarterly-update-q4-2024/8981c594072bb4aed5fb1758033d6533ccb28afa.jpeg)

### OrdinaryOrbits

From the creator of the award winning documentary: "Junk Food", comes "Alphanet Wisdom". He’s unleashing extraordinary tidbits of knowledge.

*If you aren’t following* [*@OrdinaryOrbits*](https://x.com/ordinaryorbits)*, you are NGMI.*

### Sugoi’s Three-Year Montage

He compiled a nostalgic trip down NoM-lane to celebrate the Alphanet birthday. Go watch the [incredible montage](https://x.com/sugoibtc/status/1859560540588109974).

*Tissue box not included.*

---

Thanks for orbiting with us one more time. WAGMI… or not. But definitely maybe yes. We like what we see.
