"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useAdminActions } from "@/app/hooks/useAdminActions";
import { useWarList } from "@/app/hooks/useWarList";
import { OWNER_ADDRESS } from "@/app/config/addresses";

export default function AdminPanel({ onSetFeatured }: { onSetFeatured?: (id: number) => void }) {
  const { address } = useAccount();
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [duration, setDuration] = useState("60"); // minutes
  const [yieldBps, setYieldBps] = useState("2000"); // 20%
  const [winningSide, setWinningSide] = useState<1 | 2>(1);
  const [resolveWarId, setResolveWarId] = useState("0");
  const [isHotTopic, setIsHotTopic] = useState(true);

  const { warCount } = useWarList();
  const { createWar, resolve, cancelWar, isCreating, isResolving, isCancelling, isPending } =
    useAdminActions();

  const handleCreate = () => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const durationSec = BigInt(Number(duration) * 60);
    createWar(nameA, nameB, now, now + durationSec, BigInt(yieldBps));

    // Jika isHotTopic, set war baru sebagai featured.
    // currentWarId setelah create = warCount (sebelum increment on-chain)
    if (isHotTopic && onSetFeatured) {
      setTimeout(() => onSetFeatured(warCount), 3000);
    }
  };

  const handleResolve = () => {
    resolve(Number(resolveWarId), winningSide);
  };

  const handleCancel = () => {
    cancelWar(Number(resolveWarId));
  };

  if (!isOwner) return null;

  return (
    <div className="card" style={{ padding: 24, border: "1px solid rgba(255,215,0,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.4rem",
            letterSpacing: "0.12em",
            color: "var(--gold)",
          }}
        >
          ⚡ ADMIN CONTROL
        </span>
        <span
          className="badge badge-active"
          style={{
            background: "rgba(255,215,0,0.1)",
            color: "var(--gold)",
            borderColor: "rgba(255,215,0,0.3)",
          }}
        >
          {warCount} wars
        </span>
      </div>

      {/* Create war section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
          }}
        >
          Create New Campaign
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input
            className="input-field"
            placeholder="Side A (e.g. Jokowi)"
            value={nameA}
            onChange={(e) => setNameA(e.target.value)}
            style={{ fontSize: "0.9rem" }}
          />
          <input
            className="input-field"
            placeholder="Side B (e.g. Prabowo)"
            value={nameB}
            onChange={(e) => setNameB(e.target.value)}
            style={{ fontSize: "0.9rem" }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Duration (menit)
            </label>
            <input
              className="input-field"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{ fontSize: "0.9rem" }}
            />
          </div>
          <div>
            <label
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Yield BPS (2000=20%)
            </label>
            <input
              className="input-field"
              type="number"
              value={yieldBps}
              onChange={(e) => setYieldBps(e.target.value)}
              style={{ fontSize: "0.9rem" }}
            />
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
          <label
            htmlFor="hotTopic"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Set as HOT Topic (Featured)
          </label>
        </div>
        <button
          className="btn-battle"
          onClick={handleCreate}
          disabled={isPending || !nameA || !nameB}
          style={{
            background: "linear-gradient(135deg, var(--gold), var(--gold-dim))",
            color: "#000",
          }}
        >
          {isCreating ? "Creating…" : "🚀 Launch Campaign"}
        </button>
      </div>

      {/* Resolve / Cancel section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: 20,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
          }}
        >
          Resolve / Cancel Campaign
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              War ID
            </label>
            <input
              className="input-field"
              type="number"
              value={resolveWarId}
              onChange={(e) => setResolveWarId(e.target.value)}
              style={{ fontSize: "0.9rem" }}
            />
          </div>
          <div>
            <label
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Winner (1=A, 2=B)
            </label>
            <input
              className="input-field"
              type="number"
              value={winningSide}
              onChange={(e) => setWinningSide(Number(e.target.value) as 1 | 2)}
              min="1"
              max="2"
              style={{ fontSize: "0.9rem" }}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button
            className="btn-battle"
            onClick={handleResolve}
            disabled={isPending}
            style={{
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-medium)",
            }}
          >
            {isResolving ? "Resolving…" : "⚔ Resolve"}
          </button>
          <button
            className="btn-battle"
            onClick={handleCancel}
            disabled={isPending}
            style={{
              background: "var(--bg-card)",
              color: "var(--text-dim)",
              border: "1px solid rgba(255,82,82,0.3)",
            }}
          >
            {isCancelling ? "Cancelling…" : "✕ Cancel War"}
          </button>
        </div>
      </div>
    </div>
  );
}
