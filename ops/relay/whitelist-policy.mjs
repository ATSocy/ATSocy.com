#!/usr/bin/env node

import readline from 'node:readline';

const allowedPubkeys = new Set(
  (process.env.ATSRFRY_ALLOWED_PUBKEYS ?? '')
    .split(',')
    .flatMap((value) => {
      const t = value.trim().toLowerCase();
      return t ? [t] : [];
    })
);

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on('line', (line) => {
  const request = JSON.parse(line);
  if (request.type !== 'new') return;

  const response = { id: request.event.id };
  const pubkey = String(request.event.pubkey ?? '').toLowerCase();

  if (allowedPubkeys.has(pubkey)) {
    response.action = 'accept';
  } else {
    response.action = 'reject';
    response.msg = 'blocked: pubkey not allowed';
  }

  process.stdout.write(`${JSON.stringify(response)}\n`);
});
