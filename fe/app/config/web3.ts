"use client";

import { http } from "wagmi";
import { defineChain } from "viem";
import { createConfig } from "@privy-io/wagmi";
import { MONAD_TESTNET_CHAIN_ID } from "@/app/config/constants";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz";
const EXPLORER_URL =
  process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ||
  "https://testnet.monadscan.com";

export const monadTestnet = defineChain({
  id: MONAD_TESTNET_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Monadscan", url: EXPLORER_URL },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(RPC_URL),
  },
  ssr: true,
});
