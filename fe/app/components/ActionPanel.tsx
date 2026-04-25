"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useDeposit } from "@/app/hooks/useDeposit";
import { useClaim } from "@/app/hooks/useClaim";
import { useUserDeposit } from "@/app/hooks/useUserDeposit";
import { useTokenBalance } from "@/app/hooks/useTokenBalance";
import { ASSET_SYMBOL } from "@/app/config/constants";
import { formatMON } from "@/app/lib/formatters";
import type { War } from "@/app/types/contracts";

interface ActionPanelProps {
  warId: number;
  nameA: string;
  nameB: string;
  isOpen: boolean;
  status: number;
  winningSide: number;
  war?: War;
}

export default function ActionPanel({
  warId,
  nameA,
  nameB,
  isOpen,
  status,
  war,
}: ActionPanelProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");

  // Read hooks
  const {
    deposit: userDeposit,
    hasDeposit,
    side: userSide,
    hasClaimed,
    hasClaimedYield,
    estimatedYield,
    isWinner,
  } = useUserDeposit(warId);

  const { balance } = useTokenBalance();

  // Write hooks
  const { deposit, isDepositing, isConfirming: depositConfirming } = useDeposit(warId);

  const {
    claimPrincipal,
    openCrate,
    isClaiming,
    isOpening,
    isClaimConfirming,
    isOpenConfirming,
  } = useClaim(warId);

  const userIsWinner = isWinner(war);
  const isBusy =
    isDepositing || depositConfirming ||
    isClaiming || isClaimConfirming ||
    isOpening || isOpenConfirming;

  const handleDeposit = (side: 1 | 2) => {
    deposit(side, amount);
  };

  if (!address) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.3rem",
            letterSpacing: "0.1em",
            color: "var(--text-dim)",
          }}
        >
          CONNECT WALLET TO PLAY
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* MON Balance */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          color: "var(--text-dim)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Balance:{" "}
        <span style={{ color: "var(--text-secondary)" }}>
          {formatMON(balance)} {ASSET_SYMBOL}
        </span>
      </div>

      {/* Current deposit info */}
      {hasDeposit && userDeposit && (
        <div
          style={{
            padding: 16,
            background: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              marginBottom: 8,
            }}
          >
            Your Position
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.2rem",
                  color: userSide === 1 ? "var(--red-main)" : "var(--blue-main)",
                  letterSpacing: "0.1em",
                }}
              >
                {userSide === 1 ? nameA : nameB}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  marginLeft: 12,
                }}
              >
                {formatMON(userDeposit.amount)} {ASSET_SYMBOL}
              </span>
            </div>
            {estimatedYield > BigInt(0) && (
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: "var(--text-dim)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Potential Yield
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1rem",
                    color: "var(--gold)",
                    textShadow: "0 0 6px rgba(255,215,0,0.3)",
                  }}
                >
                  +{formatMON(estimatedYield)} {ASSET_SYMBOL}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deposit section (only when active & open) */}
      {isOpen && status === 0 && (
        <>
          {/* Amount input */}
          <div>
            <label
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Stake Amount ({ASSET_SYMBOL})
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.0"
                className="input-field"
                min="0"
                step="0.1"
              />
              <button
                onClick={() => setAmount("1")}
                style={{
                  padding: "0 12px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                }}
              >
                1
              </button>
              <button
                onClick={() => setAmount("5")}
                style={{
                  padding: "0 12px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                }}
              >
                5
              </button>
            </div>
          </div>

          {/* Side selection + deposit buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              className="btn-battle btn-red"
              onClick={() => handleDeposit(1)}
              disabled={isBusy || !amount || (hasDeposit && userSide !== 1)}
              style={{ opacity: hasDeposit && userSide !== 1 ? 0.3 : 1 }}
            >
              {isDepositing || depositConfirming
                ? "Staking…"
                : `Stake ${nameA}`}
            </button>
            <button
              className="btn-battle btn-blue"
              onClick={() => handleDeposit(2)}
              disabled={isBusy || !amount || (hasDeposit && userSide !== 2)}
              style={{ opacity: hasDeposit && userSide !== 2 ? 0.3 : 1 }}
            >
              {isDepositing || depositConfirming
                ? "Staking…"
                : `Stake ${nameB}`}
            </button>
          </div>
        </>
      )}

      {/* Claim section (resolved/cancelled) */}
      {(status === 1 || status === 2) && hasDeposit && !hasClaimed && (
        <button
          className="btn-battle"
          onClick={claimPrincipal}
          disabled={isBusy}
          style={{
            background: userIsWinner
              ? "linear-gradient(135deg, var(--gold), var(--gold-dim))"
              : "var(--bg-card)",
            color: userIsWinner ? "#000" : "var(--text-secondary)",
            border: userIsWinner ? "none" : "1px solid var(--border-medium)",
          }}
        >
          {isClaiming || isClaimConfirming
            ? "Claiming…"
            : userIsWinner
            ? "🏆 Claim Principal + Victory Crate"
            : "Claim Principal"}
        </button>
      )}

      {/* Open crate section */}
      {status === 1 && userIsWinner && hasClaimed && !hasClaimedYield && (
        <button
          className="btn-battle"
          onClick={openCrate}
          disabled={isBusy}
          style={{
            background: "linear-gradient(135deg, var(--gold), #FF6B00)",
            color: "#000",
            fontSize: "1.2rem",
          }}
        >
          {isOpening || isOpenConfirming ? "Opening…" : "🎁 Open Victory Crate"}
        </button>
      )}

      {/* Claimed status */}
      {hasClaimed && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-dim)",
            textAlign: "center",
          }}
        >
          ✓ Principal diklaim
          {hasClaimedYield && " · ✓ Yield diklaim"}
        </div>
      )}
    </div>
  );
}
