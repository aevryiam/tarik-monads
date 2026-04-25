// ============================================================================
// hooks/useFaucet.ts — Write hook: klaim mUSDC dari faucet MockUSDC
// ============================================================================
"use client";

import { useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { ADDRESSES } from "@/app/config/addresses";
import { MOCK_USDC_ABI } from "@/app/contracts/abi/MockUSDC.abi";
import { parseContractError } from "@/app/lib/errors";
import { toastSuccess, toastError, toastPending, toastDismiss } from "@/app/lib/toast";
import { FAUCET_AMOUNT } from "@/app/config/constants";

interface UseFaucetResult {
  /** Klaim 10,000 mUSDC dari faucet (1 jam cooldown) */
  claimFaucet: () => void;
  isPending: boolean;
  isConfirming: boolean;
  faucetTxHash: `0x${string}` | undefined;
}

export function useFaucet(): UseFaucetResult {
  const queryClient = useQueryClient();

  const {
    writeContract: writeFaucet,
    data: faucetTxHash,
    isPending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: faucetSuccess } =
    useWaitForTransactionReceipt({ hash: faucetTxHash });

  useEffect(() => {
    if (faucetSuccess && faucetTxHash) {
      const amount = Number(FAUCET_AMOUNT) / 1e6;
      toastSuccess(`${amount.toLocaleString()} mUSDC berhasil diklaim! 💧`, faucetTxHash);
      queryClient.invalidateQueries();
    }
  }, [faucetSuccess, faucetTxHash, queryClient]);

  const claimFaucet = useCallback(() => {
    const toastId = toastPending("Mengklaim mUSDC dari faucet…");
    writeFaucet(
      {
        address: ADDRESSES.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "faucet",
      },
      {
        onError: (err) => {
          toastDismiss(toastId);
          toastError(parseContractError(err));
        },
        onSuccess: () => toastDismiss(toastId),
      }
    );
  }, [writeFaucet]);

  return { claimFaucet, isPending, isConfirming, faucetTxHash };
}
