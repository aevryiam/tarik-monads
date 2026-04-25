"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDRESSES, TARIK_VAULT_ABI, OWNER_ADDRESS } from "@/app/config/contracts";

export default function AdminPanel({ onSetFeatured }: { onSetFeatured?: (id: number) => void }) {
  const { address } = useAccount();
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [duration, setDuration] = useState("60"); // minutes
  const [yieldBps, setYieldBps] = useState("2000"); // 20% — higher for demo visibility
  const [winningSide, setWinningSide] = useState("1");
  const [resolveWarId, setResolveWarId] = useState("0");
  const [isHotTopic, setIsHotTopic] = useState(true);

  const { data: currentWarId } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "currentWarId",
    query: { refetchInterval: 10000 },
  });

  // Create war
  const { writeContract: createWar, data: createHash, isPending: isCreating } = useWriteContract();
  const { isLoading: createConfirming, isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createHash });

  // Resolve war
  const { writeContract: resolve, data: resolveHash, isPending: isResolving } = useWriteContract();
  const { isLoading: resolveConfirming, isSuccess: resolveSuccess } = useWaitForTransactionReceipt({ hash: resolveHash });

  const handleCreate = () => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const durationSec = BigInt(Number(duration) * 60);
    createWar({
      address: ADDRESSES.tarikVault,
      abi: TARIK_VAULT_ABI,
      functionName: "createWar",
      args: [nameA, nameB, now, now + durationSec, BigInt(yieldBps)],
    });
  };

  // If successful and isHotTopic is true, we want to tell the parent.
  // We don't easily get the returned ID from writeContract, but we can assume it's currentWarId.
  // This is a naive implementation since currentWarId might not have updated yet, but it's fine for the demo.
  useEffect(() => {
    if (createSuccess && isHotTopic && currentWarId !== undefined && onSetFeatured) {
      // The new war ID is currentWarId (after creation)
      onSetFeatured(Number(currentWarId));
    }
  }, [createSuccess, isHotTopic, currentWarId, onSetFeatured]);

  const handleResolve = () => {
    resolve({
      address: ADDRESSES.tarikVault,
      abi: TARIK_VAULT_ABI,
      functionName: "resolve",
      args: [BigInt(resolveWarId), Number(winningSide) as 1 | 2],
    });
  };

  if (!isOwner) return null;

  return (
    <div className="card" style={{ padding: 24, border: "1px solid rgba(255,215,0,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", letterSpacing: "0.12em", color: "var(--gold)" }}>
          ⚡ ADMIN CONTROL
        </span>
        {currentWarId !== undefined && (
          <span className="badge badge-active" style={{ background: "rgba(255,215,0,0.1)", color: "var(--gold)", borderColor: "rgba(255,215,0,0.3)" }}>
            {Number(currentWarId)} wars created
          </span>
        )}
      </div>

      {/* Create war section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-dim)" }}>
          Create New Campaign
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="input-field" placeholder="Side A name (e.g. Jokowi)" value={nameA} onChange={(e) => setNameA(e.target.value)} style={{ fontSize: "0.9rem" }} />
          <input className="input-field" placeholder="Side B name (e.g. Prabowo)" value={nameB} onChange={(e) => setNameB(e.target.value)} style={{ fontSize: "0.9rem" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Duration (min)</label>
            <input className="input-field" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Yield BPS (2000=20%)</label>
            <input className="input-field" type="number" value={yieldBps} onChange={(e) => setYieldBps(e.target.value)} style={{ fontSize: "0.9rem" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <input 
            type="checkbox" 
            id="hotTopic" 
            checked={isHotTopic} 
            onChange={(e) => setIsHotTopic(e.target.checked)} 
            style={{ accentColor: "var(--red-main)", width: 16, height: 16 }}
          />
          <label htmlFor="hotTopic" style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            Set as HOT Topic (Featured in Center)
          </label>
        </div>
        <button
          className="btn-battle"
          onClick={handleCreate}
          disabled={isCreating || createConfirming || !nameA || !nameB}
          style={{
            background: "linear-gradient(135deg, var(--gold), var(--gold-dim))",
            color: "#000",
          }}
        >
          {isCreating ? "Creating…" : createConfirming ? "Confirming…" : createSuccess ? "✓ Campaign Created!" : "🚀 Launch Campaign"}
        </button>
      </div>

      {/* Resolve war section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border-subtle)", paddingTop: 20 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-dim)" }}>
          Resolve Campaign
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>War ID</label>
            <input className="input-field" type="number" value={resolveWarId} onChange={(e) => setResolveWarId(e.target.value)} style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Winner (1=A, 2=B)</label>
            <input className="input-field" type="number" value={winningSide} onChange={(e) => setWinningSide(e.target.value)} min="1" max="2" style={{ fontSize: "0.9rem" }} />
          </div>
        </div>
        <button
          className="btn-battle"
          onClick={handleResolve}
          disabled={isResolving || resolveConfirming}
          style={{
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-medium)",
          }}
        >
          {isResolving ? "Resolving…" : resolveConfirming ? "Confirming…" : resolveSuccess ? "✓ Resolved!" : "⚔ Resolve Campaign"}
        </button>
      </div>
    </div>
  );
}
