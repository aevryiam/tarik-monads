"use client";

import { useState, useEffect } from "react";

interface WarInfoProps {
  warId: number;
  nameA: string;
  nameB: string;
  startTime: number;
  endTime: number;
  status: number; // 0=Active, 1=Resolved, 2=Cancelled
  participantCount: number;
  totalDeposits: bigint;
  yieldBps: number;
  totalYield: bigint;
}

export default function WarInfo(props: WarInfoProps) {
  const { warId, nameA, nameB, startTime, endTime, status, participantCount, totalDeposits, yieldBps, totalYield } = props;
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      if (now < startTime) {
        const diff = startTime - now;
        setTimeLeft(`Starts in ${formatTime(diff)}`);
      } else if (now < endTime && status === 0) {
        const diff = endTime - now;
        setTimeLeft(formatTime(diff));
      } else {
        setTimeLeft("Ended");
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime, status]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatUSDC = (val: bigint) => Number(val / BigInt(1e6)).toLocaleString();
  const statusLabels = ["ACTIVE", "RESOLVED", "CANCELLED"];
  const statusClass = ["badge-active", "badge-resolved", "badge-cancelled"];

  return (
    <div
      className="card"
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              letterSpacing: "0.1em",
              color: "var(--text-primary)",
            }}
          >
            CAMPAIGN #{warId}
          </span>
          <span className={`badge ${statusClass[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        <StatBox label="Time Remaining" value={timeLeft} accent={status === 0} />
        <StatBox label="Total Staked" value={`$${formatUSDC(totalDeposits)}`} />
        <StatBox label="Yield Rate" value={`${yieldBps / 100}%`} accent />
        <StatBox label="Participants" value={participantCount.toString()} />
        {status === 1 && (
          <StatBox label="Total Yield" value={`$${formatUSDC(totalYield)}`} gold />
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, accent, gold }: { label: string; value: string; accent?: boolean; gold?: boolean }) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 6,
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: gold ? "var(--gold)" : accent ? "var(--text-accent)" : "var(--text-secondary)",
          textShadow: gold ? "0 0 8px rgba(255,215,0,0.4)" : "none",
        }}
      >
        {value}
      </div>
    </div>
  );
}
