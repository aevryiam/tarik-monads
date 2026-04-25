// ============================================================================
// hooks/useTokenBalance.ts - Hook untuk membaca saldo native MON
// ============================================================================
"use client";

import { useAccount, useBalance } from "wagmi";
import { REFETCH_INTERVAL } from "@/app/config/constants";

interface UseTokenBalanceResult {
  /** saldo native MON user dalam bigint (18 desimal) */
  balance: bigint;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Membaca saldo native MON wallet user.
 */
export function useTokenBalance(): UseTokenBalanceResult {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useBalance({
    address,
    query: {
      enabled: !!address,
      refetchInterval: REFETCH_INTERVAL.normal,
    },
  });

  return {
    balance: data?.value ?? BigInt(0),
    isLoading,
    refetch,
  };
}
