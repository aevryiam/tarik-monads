// ============================================================================
// hooks/useAdminActions.ts — Write hook: aksi admin TarikVault (owner only)
// ============================================================================
"use client";

import { useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { ADDRESSES } from "@/app/config/addresses";
import { MONAD_TESTNET_CHAIN_ID } from "@/app/config/constants";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { ASSET_SYMBOL } from "@/app/config/constants";
import { parseContractError } from "@/app/lib/errors";
import { toastSuccess, toastError, toastPending, toastDismiss } from "@/app/lib/toast";

interface UseAdminActionsResult {
  /** Buat war baru */
  createWar: (
    nameA: string,
    nameB: string,
    startTime: bigint,
    endTime: bigint,
    mockYieldBps: bigint
  ) => void;
  /** Resolve war dengan menentukan pemenang */
  resolve: (warId: number, winningSide: 1 | 2) => void;
  /** Batalkan war — semua user bisa refund */
  cancelWar: (warId: number) => void;
  /** Deposit yield reserve ke vault */
  fundYieldReserve: (amountStr: string) => void;

  isCreating: boolean;
  isResolving: boolean;
  isCancelling: boolean;
  isFunding: boolean;
  isPending: boolean;

  createTxHash: `0x${string}` | undefined;
  resolveTxHash: `0x${string}` | undefined;
}

export function useAdminActions(): UseAdminActionsResult {
  const queryClient = useQueryClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const ensureMonadChain = useCallback(() => {
    if (chainId === MONAD_TESTNET_CHAIN_ID) return true;

    toastError("Wallet masih di jaringan lain. Pindahkan ke Monad Testnet dulu.");
    switchChain?.({ chainId: MONAD_TESTNET_CHAIN_ID });
    return false;
  }, [chainId, switchChain]);

  // Create War
  const { writeContract: writeCreate, data: createTxHash, isPending: isCreating } =
    useWriteContract();
  const { isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createTxHash });

  // Resolve
  const { writeContract: writeResolve, data: resolveTxHash, isPending: isResolving } =
    useWriteContract();
  const { isSuccess: resolveSuccess } = useWaitForTransactionReceipt({ hash: resolveTxHash });

  // Cancel
  const { writeContract: writeCancel, isPending: isCancelling } = useWriteContract();

  // Fund Yield Reserve
  const { writeContract: writeFund, isPending: isFunding } = useWriteContract();

  // Refresh data setelah setiap aksi berhasil
  useEffect(() => {
    if (createSuccess) {
      toastSuccess("Campaign berhasil dibuat! 🚀", createTxHash);
      queryClient.invalidateQueries();
    }
  }, [createSuccess, createTxHash, queryClient]);

  useEffect(() => {
    if (resolveSuccess) {
      toastSuccess("War berhasil diselesaikan! ⚔️", resolveTxHash);
      queryClient.invalidateQueries();
    }
  }, [resolveSuccess, resolveTxHash, queryClient]);

  const createWar = useCallback(
    (
      nameA: string,
      nameB: string,
      startTime: bigint,
      endTime: bigint,
      mockYieldBps: bigint
    ) => {
      if (!ensureMonadChain()) return;

      if (!nameA.trim() || !nameB.trim()) {
        toastError("Nama Side A dan Side B tidak boleh kosong.");
        return;
      }
      const toastId = toastPending("Membuat campaign…");
      writeCreate(
        {
          address: ADDRESSES.tarikVault,
          abi: TARIK_VAULT_ABI,
          functionName: "createWar",
          args: [nameA, nameB, startTime, endTime, mockYieldBps],
        },
        {
          onError: (err) => { toastDismiss(toastId); toastError(parseContractError(err)); },
          onSuccess: () => toastDismiss(toastId),
        }
      );
    },
    [ensureMonadChain, writeCreate]
  );

  const resolve = useCallback(
    (warId: number, winningSide: 1 | 2) => {
      if (!ensureMonadChain()) return;

      const toastId = toastPending(`Menyelesaikan War #${warId}…`);
      writeResolve(
        {
          address: ADDRESSES.tarikVault,
          abi: TARIK_VAULT_ABI,
          functionName: "resolve",
          args: [BigInt(warId), winningSide],
        },
        {
          onError: (err) => { toastDismiss(toastId); toastError(parseContractError(err)); },
          onSuccess: () => toastDismiss(toastId),
        }
      );
    },
    [ensureMonadChain, writeResolve]
  );

  const cancelWar = useCallback(
    (warId: number) => {
      if (!ensureMonadChain()) return;

      const toastId = toastPending(`Membatalkan War #${warId}…`);
      writeCancel(
        {
          address: ADDRESSES.tarikVault,
          abi: TARIK_VAULT_ABI,
          functionName: "cancelWar",
          args: [BigInt(warId)],
        },
        {
          onError: (err) => { toastDismiss(toastId); toastError(parseContractError(err)); },
          onSuccess: (hash) => {
            toastDismiss(toastId);
            toastSuccess(`War #${warId} dibatalkan.`, hash);
            queryClient.invalidateQueries();
          },
        }
      );
    },
    [ensureMonadChain, writeCancel, queryClient]
  );

  const fundYieldReserve = useCallback(
    (amountStr: string) => {
      if (!ensureMonadChain()) return;

      let amount: bigint;
      try {
        amount = parseEther(amountStr);
      } catch {
        toastError("Format jumlah tidak valid.");
        return;
      }
      const toastId = toastPending("Mendepositkan yield reserve…");
      writeFund(
        {
          address: ADDRESSES.tarikVault,
          abi: TARIK_VAULT_ABI,
          functionName: "fundYieldReserve",
          args: [amount],
          value: amount,
        },
        {
          onError: (err) => { toastDismiss(toastId); toastError(parseContractError(err)); },
          onSuccess: (hash) => {
            toastDismiss(toastId);
            toastSuccess(`Yield reserve ${ASSET_SYMBOL} berhasil didepositkan.`, hash);
            queryClient.invalidateQueries();
          },
        }
      );
    },
    [ensureMonadChain, writeFund, queryClient]
  );

  return {
    createWar,
    resolve,
    cancelWar,
    fundYieldReserve,
    isCreating,
    isResolving,
    isCancelling,
    isFunding,
    isPending: isCreating || isResolving || isCancelling || isFunding,
    createTxHash,
    resolveTxHash,
  };
}
