"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDRESSES, MOCK_USDC_ABI } from "@/app/config/contracts";
import { Droplets } from "lucide-react";

export default function FaucetButton() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleFaucet = () => {
    writeContract({
      address: ADDRESSES.mockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: "faucet",
      gas: BigInt(3000000),
    });
  };

  if (!address) return null;

  return (
    <button
      onClick={handleFaucet}
      disabled={isPending || isConfirming}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.8rem",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "10px 20px",
        background: isPending || isConfirming
          ? "var(--bg-card)"
          : "linear-gradient(135deg, var(--gold-dim), #8B6914)",
        color: isPending || isConfirming ? "var(--text-dim)" : "#000",
        border: "1px solid rgba(255,215,0,0.3)",
        borderRadius: 6,
        cursor: isPending || isConfirming ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        fontWeight: 700,
      }}
    >
      {isPending
        ? "Confirming…"
        : isConfirming
        ? "Mining…"
        : isSuccess
        ? "✓ Got 10k mUSDC!"
        : <><Droplets size={14} style={{ display: "inline", marginRight: 4 }} /> Faucet (10k mUSDC)</>}
      {error && (
        <span style={{ display: "block", fontSize: "0.65rem", color: "var(--red-main)", marginTop: 4 }}>
          {error.message.includes("FaucetCooldown") ? "Wait 1 hour" : "Error"}
        </span>
      )}
    </button>
  );
}
