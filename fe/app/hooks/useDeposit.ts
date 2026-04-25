// ============================================================================
// hooks/useDeposit.ts — Write hook: approve (exact) + deposit ke TarikVault
// ============================================================================
"use client";

import { useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseUnits } from "viem";
import { ADDRESSES } from "@/app/config/addresses";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { MOCK_USDC_ABI } from "@/app/contracts/abi/MockUSDC.abi";
import { USDC_DECIMALS } from "@/app/config/constants";
import { parseContractError } from "@/app/lib/errors";
import { toastSuccess, toastError, toastPending, toastDismiss } from "@/app/lib/toast";

interface UseDepositResult {
  /**
   * Jalankan deposit. Jika allowance kurang, otomatis approve dulu
   * (exact approve — approve sejumlah amount, bukan infinite).
   * @param side 1 = Side A, 2 = Side B
   * @param amountStr jumlah dalam string USDC (misal "1000")
   * @param currentAllowance allowance saat ini dari useTokenBalance
   */
  deposit: (side: 1 | 2, amountStr: string, currentAllowance: bigint) => void;
  isApproving: boolean;
  isDepositing: boolean;
  isConfirming: boolean;
  depositTxHash: `0x${string}` | undefined;
}

export function useDeposit(warId: number): UseDepositResult {
  const queryClient = useQueryClient();

  // --- Approve ---
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApproving,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: approveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  // --- Deposit ---
  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    isPending: isDepositing,
    reset: resetDeposit,
  } = useWriteContract();

  const { isLoading: depositConfirming, isSuccess: depositSuccess } =
    useWaitForTransactionReceipt({ hash: depositTxHash });

  // State internal: simpan args untuk deposit setelah approve selesai
  let pendingDepositArgs: { side: 1 | 2; amount: bigint } | null = null;

  // Ketika approve sukses → lanjut deposit otomatis
  useEffect(() => {
    if (approveSuccess && pendingDepositArgs) {
      const { side, amount } = pendingDepositArgs;
      pendingDepositArgs = null;
      writeDeposit({
        address: ADDRESSES.tarikVault,
        abi: TARIK_VAULT_ABI,
        functionName: "deposit",
        args: [BigInt(warId), side, amount],
      });
    }
  }, [approveSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ketika deposit sukses → toast + invalidate queries
  useEffect(() => {
    if (depositSuccess && depositTxHash) {
      toastSuccess("Deposit berhasil! 🎉", depositTxHash);
      // Invalidate semua read queries agar data refresh otomatis
      queryClient.invalidateQueries();
    }
  }, [depositSuccess, depositTxHash, queryClient]);

  const deposit = useCallback(
    (side: 1 | 2, amountStr: string, currentAllowance: bigint) => {
      if (!amountStr || parseFloat(amountStr) <= 0) {
        toastError("Masukkan jumlah deposit yang valid.");
        return;
      }

      let amount: bigint;
      try {
        amount = parseUnits(amountStr, USDC_DECIMALS);
      } catch {
        toastError("Format jumlah tidak valid.");
        return;
      }

      // Exact approve: cek apakah allowance saat ini mencukupi
      if (currentAllowance < amount) {
        // Simpan deposit args untuk dieksekusi setelah approve
        pendingDepositArgs = { side, amount };

        const toastId = toastPending("Menunggu persetujuan mUSDC…");
        writeApprove(
          {
            address: ADDRESSES.mockUSDC,
            abi: MOCK_USDC_ABI,
            functionName: "approve",
            args: [ADDRESSES.tarikVault, amount], // exact amount
          },
          {
            onError: (err) => {
              toastDismiss(toastId);
              toastError(parseContractError(err));
              pendingDepositArgs = null;
            },
            onSuccess: () => {
              toastDismiss(toastId);
              toastPending("Approve sukses, mengirim deposit…");
            },
          }
        );
      } else {
        // Allowance cukup → langsung deposit
        const toastId = toastPending("Mengirim deposit…");
        writeDeposit(
          {
            address: ADDRESSES.tarikVault,
            abi: TARIK_VAULT_ABI,
            functionName: "deposit",
            args: [BigInt(warId), side, amount],
          },
          {
            onError: (err) => {
              toastDismiss(toastId);
              toastError(parseContractError(err));
            },
            onSuccess: () => toastDismiss(toastId),
          }
        );
      }
    },
    [warId, writeApprove, writeDeposit] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    deposit,
    isApproving,
    isDepositing,
    isConfirming: approveConfirming || depositConfirming,
    depositTxHash,
  };
}
