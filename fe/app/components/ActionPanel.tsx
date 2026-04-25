"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ADDRESSES, TARIK_VAULT_ABI, MOCK_USDC_ABI } from "@/app/config/contracts";

interface ActionPanelProps {
  warId: number;
  nameA: string;
  nameB: string;
  isOpen: boolean;
  status: number;
  winningSide: number;
}

export default function ActionPanel({ warId, nameA, nameB, isOpen, status, winningSide }: ActionPanelProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [selectedSide, setSelectedSide] = useState<1 | 2 | null>(null);

  // Read user deposit
  const { data: userDeposit, refetch: refetchDeposit } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "getUserDeposit",
    args: address ? [BigInt(warId), address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Read allowance
  const { data: allowance } = useReadContract({
    address: ADDRESSES.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address ? [address, ADDRESSES.tarikVault] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Read estimated yield
  const { data: estYield } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "getEstimatedYield",
    args: address ? [BigInt(warId), address] : undefined,
    query: { enabled: !!address && !!userDeposit, refetchInterval: 5000 },
  });

  // Write hooks
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { writeContract: claim, data: claimHash, isPending: isClaiming } = useWriteContract();
  const { writeContract: openCrate, data: openHash, isPending: isOpening } = useWriteContract();

  const { isLoading: approveConfirming } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: depositConfirming } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: claimConfirming } = useWaitForTransactionReceipt({ hash: claimHash });
  const { isLoading: openConfirming } = useWaitForTransactionReceipt({ hash: openHash });

  const userHasDeposit = userDeposit && userDeposit.amount > BigInt(0);
  const userSide = userDeposit?.side;
  const hasClaimed = userDeposit?.claimed;
  const hasClaimedYield = userDeposit?.yieldClaimed;
  const isWinner = status === 1 && userSide === winningSide;
  const parsedAmount = amount ? parseUnits(amount, 6) : BigInt(0);
  const needsApproval = parsedAmount > BigInt(0) && (allowance ?? BigInt(0)) < parsedAmount;

  const handleDeposit = () => {
    if (!selectedSide || parsedAmount === BigInt(0)) return;

    if (needsApproval) {
      approve({
        address: ADDRESSES.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [ADDRESSES.tarikVault, parsedAmount],
      });
      return;
    }

    deposit({
      address: ADDRESSES.tarikVault,
      abi: TARIK_VAULT_ABI,
      functionName: "deposit",
      args: [BigInt(warId), selectedSide, parsedAmount],
    });
  };

  const handleClaim = () => {
    claim({
      address: ADDRESSES.tarikVault,
      abi: TARIK_VAULT_ABI,
      functionName: "claim",
      args: [BigInt(warId)],
    });
  };

  const handleOpenCrate = () => {
    openCrate({
      address: ADDRESSES.tarikVault,
      abi: TARIK_VAULT_ABI,
      functionName: "openCrate",
      args: [BigInt(warId)],
    });
  };

  const formatUSDC = (val: bigint) => (Number(val) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2 });

  if (!address) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", letterSpacing: "0.1em", color: "var(--text-dim)" }}>
          CONNECT WALLET TO PLAY
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Current deposit info */}
      {userHasDeposit && (
        <div style={{ padding: 16, background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 8 }}>
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
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--text-secondary)", marginLeft: 12 }}>
                ${formatUSDC(userDeposit.amount)}
              </span>
            </div>
            {estYield !== undefined && estYield > BigInt(0) && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Potential Yield
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: "var(--gold)", textShadow: "0 0 6px rgba(255,215,0,0.3)" }}>
                  +${formatUSDC(estYield)}
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
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 6, display: "block" }}>
              Stake Amount (mUSDC)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="input-field"
                min="0"
                step="100"
              />
              <button
                onClick={() => setAmount("1000")}
                style={{ padding: "0 12px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 6, color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", cursor: "pointer" }}
              >
                1K
              </button>
              <button
                onClick={() => setAmount("5000")}
                style={{ padding: "0 12px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 6, color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", cursor: "pointer" }}
              >
                5K
              </button>
            </div>
          </div>

          {/* Side selection + deposit button */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              className="btn-battle btn-red"
              onClick={() => {
                setSelectedSide(1);
                if (parsedAmount > BigInt(0)) handleDeposit();
              }}
              disabled={isDepositing || depositConfirming || isApproving || approveConfirming || !amount || (userHasDeposit && userSide !== 1)}
              style={{ opacity: userHasDeposit && userSide !== 1 ? 0.3 : 1 }}
            >
              {isApproving || approveConfirming ? "Approving…" : isDepositing || depositConfirming ? "Staking…" : `Stake ${nameA}`}
            </button>
            <button
              className="btn-battle btn-blue"
              onClick={() => {
                setSelectedSide(2);
                if (parsedAmount > BigInt(0)) handleDeposit();
              }}
              disabled={isDepositing || depositConfirming || isApproving || approveConfirming || !amount || (userHasDeposit && userSide !== 2)}
              style={{ opacity: userHasDeposit && userSide !== 2 ? 0.3 : 1 }}
            >
              {isApproving || approveConfirming ? "Approving…" : isDepositing || depositConfirming ? "Staking…" : `Stake ${nameB}`}
            </button>
          </div>

          {needsApproval && parsedAmount > BigInt(0) && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--gold-dim)", textAlign: "center" }}>
              ⚠ First click will approve mUSDC spending
            </div>
          )}
        </>
      )}

      {/* Claim section (resolved/cancelled) */}
      {(status === 1 || status === 2) && userHasDeposit && !hasClaimed && (
        <button
          className="btn-battle"
          onClick={handleClaim}
          disabled={isClaiming || claimConfirming}
          style={{
            background: isWinner
              ? "linear-gradient(135deg, var(--gold), var(--gold-dim))"
              : "var(--bg-card)",
            color: isWinner ? "#000" : "var(--text-secondary)",
            border: isWinner ? "none" : "1px solid var(--border-medium)",
          }}
        >
          {isClaiming || claimConfirming
            ? "Claiming…"
            : isWinner
            ? "🏆 Claim Principal + Victory Crate"
            : "Claim Principal"}
        </button>
      )}

      {/* Open crate section */}
      {status === 1 && isWinner && hasClaimed && !hasClaimedYield && (
        <button
          className="btn-battle"
          onClick={handleOpenCrate}
          disabled={isOpening || openConfirming}
          style={{
            background: "linear-gradient(135deg, var(--gold), #FF6B00)",
            color: "#000",
            fontSize: "1.2rem",
          }}
        >
          {isOpening || openConfirming ? "Opening…" : "🎁 Open Victory Crate"}
        </button>
      )}

      {hasClaimed && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", textAlign: "center" }}>
          ✓ Principal claimed
          {hasClaimedYield && " · ✓ Yield claimed"}
        </div>
      )}
    </div>
  );
}
