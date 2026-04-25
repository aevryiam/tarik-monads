// ============================================================================
// hooks/useWarList.ts — Hook untuk membaca daftar semua wars
// ============================================================================
"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { ADDRESSES } from "@/app/config/addresses";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { REFETCH_INTERVAL } from "@/app/config/constants";
import { WarStatus } from "@/app/types/contracts";
import type { War, WarWithId } from "@/app/types/contracts";

interface UseWarListResult {
  warCount: number;
  wars: WarWithId[];
  /** Wars yang masih aktif (status Active), termasuk yang menunggu resolusi */
  activeWars: WarWithId[];
  /** Wars yang sudah Resolved atau Cancelled */
  resolvedWars: WarWithId[];
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

  /**
   * Tampilkan semua campaign Active. Campaign yang endTime-nya sudah lewat
   * tetap perlu muncul agar owner bisa resolve dan user paham campaign-nya
   * belum hilang, hanya menunggu settlement.
   */
  const activeWars = wars.filter((w) => w.status === WarStatus.Active);

  const resolvedWars = wars.filter(
    (w) => w.status === WarStatus.Resolved || w.status === WarStatus.Cancelled
  );

  return {
    warCount,
    wars,
    activeWars,
    resolvedWars,
    isLoading: countLoading || warsLoading,
    refetch,
  };
}
