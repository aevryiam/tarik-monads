// ============================================================================
// hooks/useTokenBalance.ts — Hook untuk membaca saldo dan allowance mUSDC
// ============================================================================
"use client";

import { useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { ADDRESSES } from "@/app/config/addresses";
import { MOCK_USDC_ABI } from "@/app/contracts/abi/MockUSDC.abi";
import { REFETCH_INTERVAL, FAUCET_COOLDOWN_SECONDS } from "@/app/config/constants";

interface UseTokenBalanceResult {
  /** saldo mUSDC user dalam bigint (6 desimal) */
  balance: bigint;
  /** allowance mUSDC user ke TarikVault dalam bigint */
  allowance: bigint;
  /** Timestamp terakhir klaim faucet (Unix seconds) */
  lastFaucetTime: bigint;
  /** Apakah user bisa klaim faucet sekarang */
  canUseFaucet: boolean;
  /** Sisa waktu cooldown faucet dalam detik (0 jika bisa klaim) */
  faucetCooldownRemaining: number;
  /**
   * Helper: apakah perlu approve dulu sebelum deposit amount tertentu?
   * Gunakan exact approve strategy (cek per transaksi).
   */
  needsApproval: (amount: bigint) => boolean;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Membaca saldo mUSDC, allowance ke vault, dan status faucet user.
 */
export function useTokenBalance(): UseTokenBalanceResult {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: ADDRESSES.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: ADDRESSES.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "allowance",
        args: address ? [address, ADDRESSES.tarikVault] : undefined,
      },
      {
        address: ADDRESSES.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "lastFaucetTime",
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: REFETCH_INTERVAL.normal,
    },
  });

  const balance = (data?.[0]?.result as bigint | undefined) ?? BigInt(0);
  const allowance = (data?.[1]?.result as bigint | undefined) ?? BigInt(0);
  const lastFaucetTime = (data?.[2]?.result as bigint | undefined) ?? BigInt(0);

  const nowSec = Math.floor(Date.now() / 1000);
  const lastFaucetSec = Number(lastFaucetTime);
  const elapsed = nowSec - lastFaucetSec;
  const canUseFaucet = lastFaucetSec === 0 || elapsed >= FAUCET_COOLDOWN_SECONDS;
  const faucetCooldownRemaining = canUseFaucet
    ? 0
    : FAUCET_COOLDOWN_SECONDS - elapsed;

  // Exact approve: cek allowance < amount yang akan di-deposit
  const needsApproval = (amount: bigint): boolean => {
    return amount > BigInt(0) && allowance < amount;
  };

  return {
    balance,
    allowance,
    lastFaucetTime,
    canUseFaucet,
    faucetCooldownRemaining,
    needsApproval,
    isLoading,
    refetch,
  };
}
