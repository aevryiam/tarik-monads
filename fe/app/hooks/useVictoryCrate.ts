// ============================================================================
// hooks/useVictoryCrate.ts — Hook untuk membaca status Victory Crate NFT user
// ============================================================================
"use client";

import { useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { ADDRESSES } from "@/app/config/addresses";
import { VICTORY_CRATE_ABI } from "@/app/contracts/abi/VictoryCrate.abi";
import { REFETCH_INTERVAL } from "@/app/config/constants";

interface UseVictoryCrateResult {
  /** Apakah user memiliki crate untuk war ini (balance > 0) */
  hasCrate: boolean;
  /** Apakah crate sudah dibuka (yield diklaim) */
  isOpened: boolean;
  /** Jumlah yield USDC dalam crate (bigint, 6 desimal) */
  yieldAmount: bigint;
  /** Balance ERC1155 mentah */
  balance: bigint;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Membaca status Victory Crate NFT user untuk war tertentu.
 * ERC1155 menggunakan warId sebagai token ID.
 */
export function useVictoryCrate(warId: number): UseVictoryCrateResult {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: ADDRESSES.victoryCrate,
        abi: VICTORY_CRATE_ABI,
        functionName: "balanceOf",
        args: address ? [address, BigInt(warId)] : undefined,
      },
      {
        address: ADDRESSES.victoryCrate,
        abi: VICTORY_CRATE_ABI,
        functionName: "crateOpened",
        args: address ? [BigInt(warId), address] : undefined,
      },
      {
        address: ADDRESSES.victoryCrate,
        abi: VICTORY_CRATE_ABI,
        functionName: "crateYield",
        args: [BigInt(warId)],
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: REFETCH_INTERVAL.slow,
    },
  });

  const balance = (data?.[0]?.result as bigint | undefined) ?? BigInt(0);
  const isOpened = (data?.[1]?.result as boolean | undefined) ?? false;
  const yieldAmount = (data?.[2]?.result as bigint | undefined) ?? BigInt(0);
  const hasCrate = balance > BigInt(0);

  return { hasCrate, isOpened, yieldAmount, balance, isLoading, refetch };
}
