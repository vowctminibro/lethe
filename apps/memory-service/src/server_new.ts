import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromHEX } from '@mysten/sui/utils';

dotenv.config();

const {
  LETHE_PACKAGE_ID,
  KHUN_TUM_NPC_ID,
  DEPLOYER_PRIVATE_KEY,
  PORT = '3001',
} = process.env as Record<string, string>;

if (!LETHE_PACKAGE_ID || !KHUN_TUM_NPC_ID || !DEPLOYER_PRIVATE_KEY) {
  console.error('Missing required env: LETHE_PACKAGE_ID, KHUN_TUM_NPC_ID, DEPLOYER_PRIVATE_KEY');
  process.exit(1);
}

// Init Sui testnet client
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// Init deployer keypair (suiprivkey1... format → base64)
function decodePrivKey(priv: string): Uint8Array {
  // suiprivkey1 prefix is base58 encoding of the actual key bytes
  // The Ed25519Keypair can import from bech32 or base64
  // suiprivkey1 is a bech32-encoded ed25519 private key
  const bech32 = priv.trim();
  // Remove prefix and decode bech32
  const DATA_PART = 'qpczlh2xatx56qwhhcuyl2366cwcs0hazp24zttzdzectspfr0kng0duwsx';
  // Use raw base64 if it's the actual key bytes
  // The suiprivkey1 format is bech32, we need to decode it
  // Try parsing as raw hex/foundational key via @mysten/sui/utils
  return fromHEX(bech32.replace('suiprivkey1', ''));
}