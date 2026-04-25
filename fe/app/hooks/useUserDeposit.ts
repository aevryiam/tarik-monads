// ============================================================================
// hooks/useUserDeposit.ts — Hook untuk membaca deposit dan estimasi yield user
// ============================================================================
"use client";

import { useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { ADDRESSES } from "@/app/config/addresses";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { REFETCH_INTERVAL } from "@/app/config/constants";
import { WarStatus } from "@/app/types/contracts";
import type { UserDeposit, War } from "@/app/types/contracts";

interface UseUserDepositResult {
  deposit: UserDeposit | undefined;
  estimatedYield: bigint;
  /** Apakah user sudah deposit di war ini */
  hasDeposit: boolean;
  /** Side user (1=A, 2=B, 0=belum deposit) */
  side: number;
  /** Apakah principal sudah diklaim */
  hasClaimed: boolean;
  /** Apakah yield (crate) sudah diklaim */
  hasClaimedYield: boolean;
  /** Apakah user adalah pemenang (war resolved & user di winning side) */
  isWinner: (war: War | undefined) => boolean;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Membaca deposit data dan estimasi yield untuk user yang sedang connect.
 * Otomatis disabled jika wallet belum connect.
 */
export function useUserDeposit(warId: number): UseUserDepositResult {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: ADDRESSES.tarikVault,
        abi: TARIK_VAULT_ABI,
        functionName: "getUserDeposit",
        args: address ? [BigInt(warId), address] : undefined,
      },
      {
        address: ADDRESSES.tarikVault,
        abi: TARIK_VAULT_ABI,
        functionName: "getEstimatedYield",
        args: address ? [BigInt(warId), address] : undefined,
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: REFETCH_INTERVAL.normal,
    },
  });

  const deposit = data?.[0]?.result as UserDeposit | undefined;
  const estimatedYield = (data?.[1]?.result as bigint | undefined) ?? BigInt(0);

  const hasDeposit = deposit !== undefined && deposit.amount > BigInt(0);
  const side = deposit?.side ?? 0;
  const hasClaimed = deposit?.claimed ?? false;
  const hasClaimedYield = deposit?.yieldClaimed ?? false;

  const isWinner = (war: War | undefined): boolean => {
    if (!war || !deposit) return false;
    return (
      war.status === WarStatus.Resolved &&
      deposit.side === war.winningSide &&
      deposit.amount > BigInt(0)
    );
  };

  return {
    deposit,
    estimatedYield,
    hasDeposit,
    side,
    hasClaimed,
    hasClaimedYield,
    isWinner,
    isLoading,
    refetch,
  };
}
