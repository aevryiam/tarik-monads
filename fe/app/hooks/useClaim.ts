// ============================================================================
// hooks/useClaim.ts — Write hook: claim principal + openCrate (yield)
// ============================================================================
"use client";

import { useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { ADDRESSES } from "@/app/config/addresses";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { parseContractError } from "@/app/lib/errors";
import { toastSuccess, toastError, toastPending, toastDismiss } from "@/app/lib/toast";

interface UseClaimResult {
  /** Klaim principal (wajib dilakukan sebelum openCrate) */
  claimPrincipal: () => void;
  /** Buka Victory Crate untuk mengklaim yield USDC */
  openCrate: () => void;
  isClaiming: boolean;
  isOpening: boolean;
  isClaimConfirming: boolean;
  isOpenConfirming: boolean;
  claimTxHash: `0x${string}` | undefined;
  openTxHash: `0x${string}` | undefined;
}

export function useClaim(warId: number): UseClaimResult {
  const queryClient = useQueryClient();

  // --- Claim Principal ---
  const {
    writeContract: writeClaim,
    data: claimTxHash,
    isPending: isClaiming,
  } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: claimSuccess } =
    useWaitForTransactionReceipt({ hash: claimTxHash });

  // --- Open Crate ---
  const {
    writeContract: writeOpen,
    data: openTxHash,
    isPending: isOpening,
  } = useWriteContract();

  const { isLoading: isOpenConfirming, isSuccess: openSuccess } =
    useWaitForTransactionReceipt({ hash: openTxHash });

  // Setelah claim berhasil
  useEffect(() => {
    if (claimSuccess && claimTxHash) {
      toastSuccess("Principal berhasil diklaim! 💰", claimTxHash);
      queryClient.invalidateQueries();
    }
  }, [claimSuccess, claimTxHash, queryClient]);

  // Setelah open crate berhasil
  useEffect(() => {
    if (openSuccess && openTxHash) {
      toastSuccess("🎁 Victory Crate dibuka! Yield USDC diterima!", openTxHash);
      queryClient.invalidateQueries();
    }
  }, [openSuccess, openTxHash, queryClient]);

  const claimPrincipal = useCallback(() => {
    const toastId = toastPending("Mengklaim principal…");
    writeClaim(
      {
        address: ADDRESSES.tarikVault,
        abi: TARIK_VAULT_ABI,
        functionName: "claim",
        args: [BigInt(warId)],
      },
      {
        onError: (err) => {
          toastDismiss(toastId);
          toastError(parseContractError(err));
        },
        onSuccess: () => toastDismiss(toastId),
      }
    );
  }, [warId, writeClaim]);

  const openCrate = useCallback(() => {
    const toastId = toastPending("Membuka Victory Crate…");
    writeOpen(
      {
        address: ADDRESSES.tarikVault,
        abi: TARIK_VAULT_ABI,
        functionName: "openCrate",
        args: [BigInt(warId)],
      },
      {
        onError: (err) => {
          toastDismiss(toastId);
          toastError(parseContractError(err));
        },
        onSuccess: () => toastDismiss(toastId),
      }
    );
  }, [warId, writeOpen]);

  return {
    claimPrincipal,
    openCrate,
    isClaiming,
    isOpening,
    isClaimConfirming,
    isOpenConfirming,
    claimTxHash,
    openTxHash,
  };
}
