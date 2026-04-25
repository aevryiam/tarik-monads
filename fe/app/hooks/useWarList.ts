// ============================================================================
// hooks/useWarList.ts — Hook untuk membaca daftar semua wars
// ============================================================================
"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { ADDRESSES } from "@/app/config/addresses";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { REFETCH_INTERVAL } from "@/app/config/constants";
import type { War, WarWithId } from "@/app/types/contracts";

interface UseWarListResult {
  warCount: number;
  wars: WarWithId[];
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Membaca total war count, lalu batch-read semua war data dalam satu multicall.
 */
export function useWarList(): UseWarListResult {
  // Step 1: ambil jumlah wars
  const { data: currentWarId, isLoading: countLoading, refetch } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "currentWarId",
    query: { refetchInterval: REFETCH_INTERVAL.normal },
  });

  const warCount = currentWarId !== undefined ? Number(currentWarId) : 0;

  // Step 2: batch-read semua wars dalam satu call
  const { data: warsData, isLoading: warsLoading } = useReadContracts({
    contracts: Array.from({ length: warCount }, (_, i) => ({
      address: ADDRESSES.tarikVault,
      abi: TARIK_VAULT_ABI,
      functionName: "getWar" as const,
      args: [BigInt(i)] as const,
    })),
    query: {
      enabled: warCount > 0,
      refetchInterval: REFETCH_INTERVAL.normal,
    },
  });

  const wars: WarWithId[] = (warsData ?? [])
    .map((item, i) => {
      const war = item.result as War | undefined;
      if (!war) return null;
      return { ...war, warId: i };
    })
    .filter((w): w is WarWithId => w !== null);

  return {
    warCount,
    wars,
    isLoading: countLoading || warsLoading,
    refetch,
  };
}
