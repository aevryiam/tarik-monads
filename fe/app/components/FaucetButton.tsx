"use client";

import { useAccount } from "wagmi";
import { Droplets } from "lucide-react";
import { useFaucet } from "@/app/hooks/useFaucet";
import { useTokenBalance } from "@/app/hooks/useTokenBalance";
import { formatTimeRemaining } from "@/app/lib/formatters";

export default function FaucetButton() {
  const { address } = useAccount();
  const { claimFaucet, isPending, isConfirming } = useFaucet();
  const { canUseFaucet, faucetCooldownRemaining } = useTokenBalance();

  if (!address) return null;

  const isBusy = isPending || isConfirming;
  const isDisabled = isBusy || !canUseFaucet;

  return (
    <button
      onClick={claimFaucet}
      disabled={isDisabled}
      title={!canUseFaucet ? `Cooldown: ${formatTimeRemaining(faucetCooldownRemaining)}` : undefined}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.8rem",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "10px 20px",
        background: isDisabled
          ? "var(--bg-card)"
          : "linear-gradient(135deg, var(--gold-dim), #8B6914)",
        color: isDisabled ? "var(--text-dim)" : "#000",
        border: "1px solid rgba(255,215,0,0.3)",
        borderRadius: 6,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        fontWeight: 700,
      }}
    >
      {isPending
        ? "Confirming…"
        : isConfirming
        ? "Mining…"
        : !canUseFaucet
        ? `⏳ ${formatTimeRemaining(faucetCooldownRemaining)}`
        : (
          <>
            <Droplets size={14} style={{ display: "inline", marginRight: 4 }} />
            Faucet (10k mUSDC)
          </>
        )}
    </button>
  );
}
