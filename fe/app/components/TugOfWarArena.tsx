"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface TugOfWarArenaProps {
  nameA: string;
  nameB: string;
  tvlA: bigint;
  tvlB: bigint;
  pctA: number; // 0-10000 basis points
  pctB: number;
  status: number; // 0=Active, 1=Resolved, 2=Cancelled
  winningSide: number; // 0, 1, or 2
  yieldBps: number;
  totalDeposits: bigint;
}

// SVG character: a simple cartoon figure pulling rope
function PullingFigure({ side, name, pct, isWinner }: { side: "left" | "right"; name: string; pct: number; isWinner: boolean }) {
  const color = side === "left" ? "var(--red-main)" : "var(--blue-main)";
  const glowColor = side === "left" ? "rgba(230,57,70,0.6)" : "rgba(29,111,255,0.6)";
  const leanAngle = side === "left" ? -15 : 15;
  const pull = pct > 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -200 : 200, rotate: side === "left" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0, rotate: pull ? leanAngle : 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 12, delay: side === "left" ? 0.3 : 0.5 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        filter: isWinner ? `drop-shadow(0 0 20px ${glowColor})` : "none",
      }}
    >
      {/* Character body */}
      <motion.svg
        width="120"
        height="160"
        viewBox="0 0 120 160"
        animate={pull ? { x: [0, side === "left" ? -6 : 6, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }}
      >
        {/* Head */}
        <circle cx="60" cy="30" r="22" fill={color} opacity="0.9" />
        {/* Eyes */}
        <circle cx="52" cy="26" r="3" fill="#fff" />
        <circle cx="68" cy="26" r="3" fill="#fff" />
        <circle cx={pull ? 50 : 53} cy="26" r="1.5" fill="#111" />
        <circle cx={pull ? 66 : 69} cy="26" r="1.5" fill="#111" />
        {/* Mouth - determined / grinning */}
        {pull ? (
          <path d="M50 38 Q60 44 70 38" stroke="#fff" strokeWidth="2" fill="none" />
        ) : (
          <line x1="50" y1="38" x2="70" y2="38" stroke="#fff" strokeWidth="2" />
        )}
        {/* Body */}
        <rect x="45" y="52" width="30" height="45" rx="6" fill={color} opacity="0.85" />
        {/* Arms pulling rope */}
        <motion.line
          x1={side === "left" ? 45 : 75}
          y1="65"
          x2={side === "left" ? 10 : 110}
          y2="58"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          animate={pull ? { x2: side === "left" ? [10, 5, 10] : [110, 115, 110] } : {}}
          transition={{ repeat: Infinity, duration: 0.3 }}
        />
        {/* Other arm */}
        <motion.line
          x1={side === "left" ? 45 : 75}
          y1="75"
          x2={side === "left" ? 15 : 105}
          y2="72"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          animate={pull ? { x2: side === "left" ? [15, 10, 15] : [105, 110, 105] } : {}}
          transition={{ repeat: Infinity, duration: 0.35, delay: 0.1 }}
        />
        {/* Legs - planted */}
        <line x1="52" y1="97" x2={side === "left" ? 40 : 48} y2="140" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <line x1="68" y1="97" x2={side === "left" ? 72 : 80} y2="140" stroke={color} strokeWidth="6" strokeLinecap="round" />
        {/* Feet */}
        <ellipse cx={side === "left" ? 38 : 46} cy="142" rx="8" ry="4" fill={color} />
        <ellipse cx={side === "left" ? 70 : 78} cy="142" rx="8" ry="4" fill={color} />
      </motion.svg>

      {/* Name label */}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.6rem",
          letterSpacing: "0.12em",
          color: color,
          textShadow: `0 0 15px ${glowColor}`,
        }}
      >
        {name}
      </div>

      {/* Percentage */}
      <motion.div
        key={pct}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "2.2rem",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {pct.toFixed(1)}%
      </motion.div>

      {isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ type: "spring", delay: 0.5 }}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.2rem",
            color: "var(--gold)",
            textShadow: "0 0 10px rgba(255,215,0,0.6)",
            letterSpacing: "0.15em",
          }}
        >
          🏆 WINNER
        </motion.div>
      )}
    </motion.div>
  );
}

export default function TugOfWarArena(props: TugOfWarArenaProps) {
  const { nameA, nameB, pctA, pctB, tvlA, tvlB, status, winningSide, yieldBps, totalDeposits } = props;
  const [showIntro, setShowIntro] = useState(true);
  const [yieldTicker, setYieldTicker] = useState(0);

  const percentA = pctA / 100;
  const percentB = pctB / 100;

  // Simulate yield ticking up for visual effect
  useEffect(() => {
    if (status !== 0 || totalDeposits === BigInt(0)) return;
    const baseYield = Number(totalDeposits) / 1e6 * (yieldBps / 10000);
    const interval = setInterval(() => {
      setYieldTicker((prev) => {
        const next = prev + (baseYield / 3600) * 0.5; // ticks every 500ms
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [status, totalDeposits, yieldBps]);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const formatUSDC = (val: bigint) => {
    return Number(val / BigInt(1e6)).toLocaleString();
  };

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 500 }}>
      {/* Intro overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-primary)",
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "4rem",
                letterSpacing: "0.2em",
                textAlign: "center",
              }}
            >
              <span style={{ color: "var(--red-main)" }}>{nameA}</span>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ color: "var(--text-dim)", margin: "0 16px" }}
              >
                VS
              </motion.span>
              <span style={{ color: "var(--blue-main)" }}>{nameB}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                color: "var(--text-dim)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginTop: 16,
              }}
            >
              Preparing the arena...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Arena */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "40px 0",
          position: "relative",
          minHeight: 420,
        }}
      >
        {/* Left figure */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <PullingFigure
            side="left"
            name={nameA}
            pct={percentA}
            isWinner={winningSide === 1}
          />
        </div>

        {/* Center: Rope + yield */}
        <div style={{ flex: 1.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {/* Tug of war bar */}
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              height: 32,
              borderRadius: 16,
              background: "var(--bg-secondary)",
              border: "2px solid var(--border-medium)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Red side */}
            <motion.div
              animate={{ width: `${percentA}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              style={{
                height: "100%",
                background: `linear-gradient(90deg, var(--red-dark), var(--red-main))`,
                borderRadius: "14px 0 0 14px",
                position: "relative",
              }}
            />
            {/* Knot indicator */}
            <motion.div
              animate={{ left: `${percentA}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              style={{
                position: "absolute",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "var(--gold)",
                border: "3px solid var(--bg-primary)",
                boxShadow: "0 0 12px rgba(255,215,0,0.5)",
                zIndex: 2,
              }}
            />
          </div>

          {/* Rope line visual */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", maxWidth: 400 }}>
            <div style={{ flex: 1, height: 4, background: `linear-gradient(90deg, var(--red-main), var(--red-dark))`, borderRadius: 2 }} />
            <motion.div
              animate={status === 0 ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                width: 16,
                height: 16,
                background: "var(--gold)",
                borderRadius: "50%",
                boxShadow: "0 0 10px rgba(255,215,0,0.4)",
                margin: "0 -2px",
                zIndex: 1,
              }}
            />
            <div style={{ flex: 1, height: 4, background: `linear-gradient(90deg, var(--blue-dark), var(--blue-main))`, borderRadius: 2 }} />
          </div>

          {/* TVL amounts */}
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 400 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--red-light)" }}>
              ${formatUSDC(tvlA)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--blue-light)" }}>
              ${formatUSDC(tvlB)}
            </div>
          </div>

          {/* Live yield counter */}
          {status === 0 && totalDeposits > BigInt(0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: "center",
                padding: "12px 24px",
                background: "rgba(255,215,0,0.06)",
                border: "1px solid rgba(255,215,0,0.15)",
                borderRadius: 8,
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
                Yield Accruing
              </div>
              <div className="yield-counter">
                +${yieldTicker.toFixed(4)}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)", marginTop: 4 }}>
                {yieldBps / 100}% APY → Winner takes all
              </div>
            </motion.div>
          )}

          {/* Resolved state */}
          {status === 1 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150 }}
              style={{
                textAlign: "center",
                padding: "16px 32px",
                background: "rgba(255,215,0,0.08)",
                border: "2px solid var(--gold)",
                borderRadius: 12,
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--gold)", letterSpacing: "0.12em" }}>
                WAR RESOLVED
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
                {winningSide === 1 ? nameA : nameB} dominated the arena
              </div>
            </motion.div>
          )}
        </div>

        {/* Right figure */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <PullingFigure
            side="right"
            name={nameB}
            pct={percentB}
            isWinner={winningSide === 2}
          />
        </div>
      </div>
    </div>
  );
}
