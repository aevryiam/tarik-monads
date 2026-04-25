"use client";

import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { ADDRESSES, MOCK_USDC_ABI, OWNER_ADDRESS } from "@/app/config/contracts";
import { formatUnits } from "viem";
import { motion } from "framer-motion";
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

export default function Navbar() {
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
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        background: "rgba(11, 12, 16, 0.8)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Left: Logo + nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.6rem",
            letterSpacing: "0.12em",
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          <span style={{ color: "var(--red-main)" }}>TA</span>
          <span style={{ color: "var(--text-primary)" }}>R</span>
          <span style={{ color: "var(--blue-main)" }}>IK</span>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {["Markets", "Leaderboard"].map((label) => (
            <button
              key={label}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.8rem",
                color: label === "Markets" ? "var(--text-primary)" : "var(--text-dim)",
                background: label === "Markets" ? "rgba(255,255,255,0.06)" : "transparent",
                border: "none", padding: "6px 12px", borderRadius: 6,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Balance + Auth */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {authenticated && address && balance !== undefined && (
          <div
            style={{
              fontFamily: "var(--font-mono)", fontSize: "0.75rem",
              color: "var(--text-secondary)",
              padding: "5px 10px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 6,
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
            padding: "3px 8px", borderRadius: 4, fontSize: "0.6rem",
            fontFamily: "var(--font-mono)", fontWeight: 700,
            background: "rgba(255,215,0,0.12)", color: "var(--gold)",
            border: "1px solid rgba(255,215,0,0.2)", letterSpacing: "0.08em",
          }}>
            ADMIN
          </span>
        )}

        {authenticated ? (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 8,
              border: "1px solid var(--border-subtle)",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onClick={handleLogout}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4caf50" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-primary)" }}>
              {displayName || "Connected"}
            </span>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            style={{
              fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 600,
              padding: "7px 16px",
              background: "var(--text-primary)", color: "var(--bg-primary)",
              border: "none", borderRadius: 8, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {isPrivyEnabled ? "Sign In" : "Connect Wallet"}
          </motion.button>
        )}
      </div>
    </nav>
  );
}
