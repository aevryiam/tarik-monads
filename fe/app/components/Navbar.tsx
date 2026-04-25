"use client";

import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { ADDRESSES, MOCK_USDC_ABI, OWNER_ADDRESS } from "@/app/config/contracts";
import { formatUnits } from "viem";
import { motion } from "framer-motion";
import { PackageOpen } from "lucide-react";
import { injected } from "wagmi/connectors";
import { isPrivyEnabled } from "./Providers";

// Conditionally use privy - only import when available
let usePrivyHook: (() => { login: () => void; logout: () => void; authenticated: boolean; user: any; ready: boolean }) | null = null;
if (isPrivyEnabled) {
  try {
    // Dynamic require for privy hook
    usePrivyHook = require("@privy-io/react-auth").usePrivy;
  } catch {
    usePrivyHook = null;
  }
}

export default function Navbar({ activeView, onViewChange }: { activeView?: string, onViewChange?: (v: string) => void }) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  // Privy auth state (if available)
  const privyState = usePrivyHook ? usePrivyHook() : null;
  const authenticated = privyState?.authenticated ?? isConnected;
  const displayName = privyState?.user?.google?.name
    || privyState?.user?.email?.address?.split("@")[0]
    || (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "");

  const handleLogin = () => {
    if (privyState) {
      privyState.login();
    } else {
      connect({ connector: injected() });
    }
  };

  const handleLogout = () => {
    if (privyState) {
      privyState.logout();
    } else {
      disconnect();
    }
  };

  const { data: balance } = useReadContract({
    address: ADDRESSES.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%", position: "fixed", top: 20, left: 0, zIndex: 50, pointerEvents: "none" }}>
      <nav
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          width: "90%",
          maxWidth: 1100,
          background: "rgba(36, 39, 58, 0.7)", // Matches Catppuccin surface
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 40, 
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Left: Logo + nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onViewChange && onViewChange("grid")}>
            <img src="/logo.png" alt="Tarik Logo" style={{ height: 32, objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["Markets", "Leaderboard", "Lootboxes"].map((label) => {
              const viewValue = label === "Markets" ? "grid" : label.toLowerCase();
              const isActive = activeView === viewValue;
              return (
                <button
                  key={label}
                  onClick={() => onViewChange && onViewChange(viewValue)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 600,
                    color: isActive ? "var(--blue-main)" : "var(--text-secondary)",
                    background: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
                    border: "none", padding: "8px 16px", borderRadius: 20,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {label === "Lootboxes" ? <><PackageOpen size={16} /> Lootboxes</> : label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Balance + Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {authenticated && address && balance !== undefined && (
            <div
              style={{
                fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                color: "var(--text-secondary)",
                padding: "6px 12px",
                background: "rgba(0,0,0,0.03)",
                borderRadius: 20,
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <span style={{ color: "var(--gold)" }}>
                {Number(formatUnits(balance, 6)).toLocaleString()}
              </span>{" "}
              <span style={{ color: "var(--text-dim)" }}>mUSDC</span>
            </div>
          )}

          {isOwner && (
            <span style={{
              padding: "4px 10px", borderRadius: 20, fontSize: "0.6rem",
              fontFamily: "var(--font-mono)", fontWeight: 700,
              background: "rgba(255,215,0,0.15)", color: "var(--gold)",
              border: "1px solid rgba(255,215,0,0.3)", letterSpacing: "0.05em",
            }}>
              ADMIN
            </span>
          )}

          {authenticated ? (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 14px",
                background: "rgba(0,0,0,0.03)",
                borderRadius: 20,
                border: "1px solid rgba(0,0,0,0.05)",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onClick={handleLogout}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4caf50", boxShadow: "0 0 8px #4caf50" }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>
                {displayName || "Connected"}
              </span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 700,
                padding: "8px 20px",
                background: "linear-gradient(90deg, var(--blue-main), var(--blue-glow))", 
                color: "#fff",
                border: "none", borderRadius: 20, cursor: "pointer",
                boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
              }}
            >
              {isPrivyEnabled ? "Sign In" : "Connect"}
            </motion.button>
          )}
        </div>
      </nav>
    </div>
  );
}
