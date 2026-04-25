// ============================================================================
// hooks/useWar.ts — Hook untuk membaca data satu war dari TarikVault
// ============================================================================
"use client";

import { useReadContracts } from "wagmi";
import { ADDRESSES } from "@/app/config/addresses";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { REFETCH_INTERVAL } from "@/app/config/constants";
import type { War, TugPosition } from "@/app/types/contracts";

interface UseWarResult {
  war: War | undefined;
  tugPosition: TugPosition | undefined;
  isOpen: boolean;
  timeRemaining: bigint;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Membaca semua data satu war menggunakan multicall (useReadContracts).
 * Mengurangi jumlah RPC calls dari 4 menjadi 1 batch request.
 */
export function useWar(warId: number): UseWarResult {
  const baseContract = {
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
  } as const;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...baseContract, functionName: "getWar", args: [BigInt(warId)] },
      { ...baseContract, functionName: "getTugOfWarPosition", args: [BigInt(warId)] },
      { ...baseContract, functionName: "isDepositOpen", args: [BigInt(warId)] },
      { ...baseContract, functionName: "getTimeRemaining", args: [BigInt(warId)] },
    ],
    query: {
      refetchInterval: REFETCH_INTERVAL.fast,
    },
  });

  const war = data?.[0]?.result as War | undefined;
  const tugRaw = data?.[1]?.result as readonly [bigint, bigint] | undefined;
  const tugPosition: TugPosition | undefined = tugRaw
    ? { pctA: tugRaw[0], pctB: tugRaw[1] }
    : undefined;
  const isOpen = (data?.[2]?.result as boolean | undefined) ?? false;
  const timeRemaining = (data?.[3]?.result as bigint | undefined) ?? BigInt(0);

  return { war, tugPosition, isOpen, timeRemaining, isLoading, refetch };
}
