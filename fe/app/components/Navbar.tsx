"use client";

import { useState, type ReactNode } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, PackageOpen, ShieldAlert, Target, Trophy, TrendingUp } from "lucide-react";
import { injected } from "wagmi/connectors";
import { usePrivy } from "@privy-io/react-auth";
import { OWNER_ADDRESS } from "@/app/config/addresses";
import { ASSET_SYMBOL } from "@/app/config/constants";
import { formatMON } from "@/app/lib/formatters";
import { useTokenBalance } from "@/app/hooks/useTokenBalance";
import { useUserStats } from "@/app/hooks/useUserStats";
import { isPrivyEnabled } from "./Providers";

type NavbarProps = { activeView?: string, onViewChange?: (v: string) => void };
type PrivyState = ReturnType<typeof usePrivy>;

export default function Navbar(props: NavbarProps) {
  return isPrivyEnabled ? <PrivyNavbar {...props} /> : <NavbarContent {...props} />;
}

function PrivyNavbar(props: NavbarProps) {
  const privyState = usePrivy();
  return <NavbarContent {...props} privyState={privyState} />;
}

function NavbarContent({ activeView, onViewChange, privyState }: NavbarProps & { privyState?: PrivyState }) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { balance } = useTokenBalance();
  const stats = useUserStats();
  const [profileOpen, setProfileOpen] = useState(false);
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const authenticated = privyState?.authenticated ?? isConnected;
  const displayName = privyState?.user?.google?.name
    || privyState?.user?.email?.address?.split("@")[0]
    || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");

  const handleLogin = () => {
    if (privyState) {
      privyState.login();
    } else {
      connect({ connector: injected() });
    }
  };

  const handleLogout = () => {
    setProfileOpen(false);
    if (privyState) {
      privyState.logout();
    } else {
      disconnect();
    }
  };

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
          background: "#ffffff",
          border: "1px solid var(--border-subtle)",
          borderRadius: 40,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onViewChange && onViewChange("grid")}>
            <img src="/logo.png" alt="Tarik Logo" style={{ height: 32, objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["Markets", "Leaderboard", "Lootboxes", ...(isOwner ? ["Admin"] : [])].map((label) => {
              const viewValue = label === "Markets" ? "grid" : label.toLowerCase();
              const isActive = activeView === viewValue;
              return (
                <button
                  key={label}
                  onClick={() => onViewChange && onViewChange(viewValue)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 600,
                    color: isActive ? "var(--blue-main)" : "#64748b",
                    background: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
                    border: "none", padding: "8px 16px", borderRadius: 20,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {label === "Lootboxes" ? <><PackageOpen size={16} /> Lootboxes</> :
                   label === "Admin" ? <><ShieldAlert size={16} /> Admin Dashboard</> : label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {authenticated && address && (
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
              <span style={{ color: "var(--gold)" }}>{formatMON(balance)}</span>{" "}
              <span style={{ color: "var(--text-dim)" }}>{ASSET_SYMBOL}</span>
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
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setProfileOpen((open) => !open)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 14px",
                  background: "rgba(0,0,0,0.03)",
                  borderRadius: 20,
                  border: "1px solid rgba(0,0,0,0.05)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4caf50", boxShadow: "0 0 8px #4caf50" }} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>
                  {displayName || "Connected"}
                </span>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    style={{
                      position: "absolute",
                      top: 48,
                      right: 0,
                      width: 320,
                      padding: 16,
                      background: "#ffffff",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 8,
                      boxShadow: "0 18px 50px rgba(15,23,42,0.16)",
                      zIndex: 80,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "0.08em", color: "var(--text-primary)" }}>
                          PROFILE
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-dim)" }}>
                          {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : ""}
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        title="Disconnect wallet"
                        style={{
                          width: 32,
                          height: 32,
                          display: "grid",
                          placeItems: "center",
                          border: "1px solid rgba(0,0,0,0.08)",
                          background: "rgba(0,0,0,0.03)",
                          borderRadius: 6,
                          cursor: "pointer",
                          color: "var(--text-dim)",
                        }}
                      >
                        <LogOut size={15} />
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <ProfileStat icon={<Trophy size={15} />} label="Win Rate" value={stats.isLoading ? "..." : `${stats.winRate}%`} />
                      <ProfileStat icon={<TrendingUp size={15} />} label="Yield" value={stats.isLoading ? "..." : formatMON(stats.totalYield)} />
                      <ProfileStat icon={<PackageOpen size={15} />} label="Victory Tokens" value={stats.isLoading ? "..." : stats.victoryTokens.toString()} />
                      <ProfileStat icon={<Target size={15} />} label="Active" value={stats.isLoading ? "..." : stats.activePositions.toString()} />
                    </div>

                    <div style={{
                      marginTop: 12,
                      padding: "10px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      border: "1px solid rgba(0,0,0,0.06)",
                      borderRadius: 8,
                      background: "rgba(0,0,0,0.025)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.72rem",
                      color: "var(--text-dim)",
                    }}>
                      <span>{stats.wins}W / {stats.losses}L</span>
                      <span>{stats.totalCrates} crates minted</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

function ProfileStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{
      minHeight: 76,
      padding: 12,
      border: "1px solid rgba(0,0,0,0.06)",
      borderRadius: 8,
      background: "rgba(0,0,0,0.025)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-dim)", marginBottom: 8 }}>
        <span style={{ display: "grid", placeItems: "center", color: "var(--gold)" }}>{icon}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}
