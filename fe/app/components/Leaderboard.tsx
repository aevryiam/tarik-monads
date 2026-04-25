"use client";

import { motion } from "framer-motion";
import { parseEther } from "viem";
import { ASSET_SYMBOL } from "@/app/config/constants";
import { formatMON } from "@/app/lib/formatters";

const MOCK_LEADERBOARD = [
  { rank: 1, address: "0x8B35...4478", yield: parseEther("2450"), winRate: 78 },
  { rank: 2, address: "0x1A2B...9C8D", yield: parseEther("1820"), winRate: 65 },
  { rank: 3, address: "0x5C6D...3E4F", yield: parseEther("1540"), winRate: 60 },
  { rank: 4, address: "0x7E8F...1A2B", yield: parseEther("980"), winRate: 54 },
  { rank: 5, address: "0x9G0H...5C6D", yield: parseEther("720"), winRate: 51 },
];

export default function Leaderboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "40px 0" }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", color: "var(--gold)", letterSpacing: "0.1em" }}>
          GLOBAL LEADERBOARD
        </h2>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
          Top commanders ranked by total yield claimed.
        </p>
      </div>

      <div style={{
        background: "var(--bg-card)",
        borderRadius: 16,
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr",
          padding: "16px 24px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-medium)",
          fontFamily: "var(--font-mono)", fontSize: "0.75rem",
          color: "var(--text-dim)", textTransform: "uppercase",
        }}>
          <div>Rank</div>
          <div>Commander</div>
          <div style={{ textAlign: "right" }}>Win Rate</div>
          <div style={{ textAlign: "right" }}>Total Yield</div>
        </div>

        {MOCK_LEADERBOARD.map((player, index) => (
          <motion.div
            key={player.address}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr",
              padding: "20px 24px",
              borderBottom: index < MOCK_LEADERBOARD.length - 1 ? "1px solid var(--border-subtle)" : "none",
              alignItems: "center",
              background: index < 3 ? "rgba(255,215,0,0.02)" : "transparent",
            }}
          >
            <div style={{
              fontFamily: "var(--font-display)", fontSize: "1.5rem",
              color: index === 0 ? "var(--gold)" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : "var(--text-dim)",
            }}>
              #{player.rank}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--text-primary)" }}>
              {player.address}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "right" }}>
              {player.winRate}%
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", color: "var(--gold)", fontWeight: 700, textAlign: "right" }}>
              +{formatMON(player.yield)} {ASSET_SYMBOL}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
