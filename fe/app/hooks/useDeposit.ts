// ============================================================================
// hooks/useDeposit.ts - Write hook: native MON deposit ke TarikVault
// ============================================================================
"use client";

import { useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { ADDRESSES } from "@/app/config/addresses";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { ASSET_SYMBOL } from "@/app/config/constants";
import { parseContractError } from "@/app/lib/errors";
import {
  toastSuccess,
  toastError,
  toastPending,
  toastDismiss,
} from "@/app/lib/toast";

interface UseDepositResult {
  /**
   * Jalankan deposit native MON.
   * @param side 1 = Side A, 2 = Side B
   * @param amountStr jumlah dalam string MON (misal "1.5")
   */
  deposit: (side: 1 | 2, amountStr: string) => void;
  isDepositing: boolean;
  isConfirming: boolean;
  depositTxHash: `0x${string}` | undefined;
}

export function useDeposit(warId: number): UseDepositResult {
  const queryClient = useQueryClient();

  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    isPending: isDepositing,
  } = useWriteContract();

  const { isLoading: depositConfirming, isSuccess: depositSuccess } =
    useWaitForTransactionReceipt({ hash: depositTxHash });

  // Ketika deposit sukses → toast + invalidate queries
  useEffect(() => {
    if (depositSuccess && depositTxHash) {
      toastSuccess(`Deposit ${ASSET_SYMBOL} berhasil!`, depositTxHash);
      queryClient.invalidateQueries();
    }
  }, [depositSuccess, depositTxHash, queryClient]);

  const deposit = useCallback(
    (side: 1 | 2, amountStr: string) => {
      if (!amountStr || parseFloat(amountStr) <= 0) {
        toastError("Masukkan jumlah deposit yang valid.");
        return;
      }

      let amount: bigint;
      try {
        amount = parseEther(amountStr);
      } catch {
        toastError("Format jumlah tidak valid.");
        return;
      }

      const toastId = toastPending(`Mengirim deposit ${ASSET_SYMBOL}...`);
      writeDeposit(
        {
          address: ADDRESSES.tarikVault,
          abi: TARIK_VAULT_ABI,
          functionName: "deposit",
          args: [BigInt(warId), side, amount],
          value: amount,
        },
        {
          onError: (err) => {
            toastDismiss(toastId);
            toastError(parseContractError(err));
          },
          onSuccess: () => toastDismiss(toastId),
        },
      );
    },
    [warId, writeDeposit],
  );

  return {
    deposit,
    isDepositing,
    isConfirming: depositConfirming,
    depositTxHash,
  };
}
