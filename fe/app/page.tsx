"use client";

import { useAccount, useReadContract } from "wagmi";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/app/components/Navbar";
import TugOfWarArena from "@/app/components/TugOfWarArena";
import ActionPanel from "@/app/components/ActionPanel";
import WarInfo from "@/app/components/WarInfo";
import VictoryCrate from "@/app/components/VictoryCrate";
import FaucetButton from "@/app/components/FaucetButton";
import AdminPanel from "@/app/components/AdminPanel";
import { ADDRESSES, TARIK_VAULT_ABI, VICTORY_CRATE_ABI } from "@/app/config/contracts";

export default function Home() {
  const { address } = useAccount();
  const [activeWarId, setActiveWarId] = useState<number>(0);
  const [showLanding, setShowLanding] = useState(true);

  // Get total wars
  const { data: currentWarId } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "currentWarId",
    query: { refetchInterval: 8000 },
  });

  // Pick the latest war
  useEffect(() => {
    if (currentWarId !== undefined && Number(currentWarId) > 0) {
      setActiveWarId(Number(currentWarId) - 1);
    }
  }, [currentWarId]);

  // Read war data
  const { data: war } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "getWar",
    args: [BigInt(activeWarId)],
    query: { enabled: currentWarId !== undefined && Number(currentWarId) > 0, refetchInterval: 4000 },
  });

  // Read tug position
  const { data: tugPosition } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "getTugOfWarPosition",
    args: [BigInt(activeWarId)],
    query: { enabled: !!war, refetchInterval: 4000 },
  });

  // Read deposit open
  const { data: isOpen } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "isDepositOpen",
    args: [BigInt(activeWarId)],
    query: { enabled: !!war, refetchInterval: 4000 },
  });

  // Check if user has a crate to open
  const { data: crateBalance } = useReadContract({
    address: ADDRESSES.victoryCrate,
    abi: VICTORY_CRATE_ABI,
    functionName: "balanceOf",
    args: address ? [address, BigInt(activeWarId)] : undefined,
    query: { enabled: !!address && !!war, refetchInterval: 8000 },
  });

  const { data: crateOpened } = useReadContract({
    address: ADDRESSES.victoryCrate,
    abi: VICTORY_CRATE_ABI,
    functionName: "crateOpened",
    args: address ? [BigInt(activeWarId), address] : undefined,
    query: { enabled: !!address && !!war, refetchInterval: 8000 },
  });

  const { data: crateYield } = useReadContract({
    address: ADDRESSES.victoryCrate,
    abi: VICTORY_CRATE_ABI,
    functionName: "crateYield",
    args: [BigInt(activeWarId)],
    query: { enabled: !!war, refetchInterval: 8000 },
  });

  const { data: userDeposit } = useReadContract({
    address: ADDRESSES.tarikVault,
    abi: TARIK_VAULT_ABI,
    functionName: "getUserDeposit",
    args: address ? [BigInt(activeWarId), address] : undefined,
    query: { enabled: !!address && !!war, refetchInterval: 5000 },
  });

  // Auto-dismiss landing
  useEffect(() => {
    const timer = setTimeout(() => setShowLanding(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const warCount = currentWarId !== undefined ? Number(currentWarId) : 0;
  const hasWar = war && warCount > 0;
  const hasCrate = crateBalance !== undefined && crateBalance > BigInt(0);
  const isWinner = war && Number(war.status) === 1 && userDeposit && userDeposit.side === Number(war.winningSide);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Landing splash */}
      <AnimatePresence>
        {showLanding && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-primary)",
            }}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "6rem",
                letterSpacing: "0.25em",
                lineHeight: 1,
                marginBottom: 16,
              }}
            >
              <span style={{ color: "var(--red-main)" }}>TA</span>
              <span style={{ color: "var(--text-primary)" }}>R</span>
              <span style={{ color: "var(--blue-main)" }}>IK</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
              }}
            >
              Lossless Yield Wars
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 200 }}
              transition={{ delay: 1.5, duration: 1.5, ease: "easeInOut" }}
              style={{
                height: 2,
                background: "linear-gradient(90deg, var(--red-main), var(--gold), var(--blue-main))",
                marginTop: 24,
                borderRadius: 2,
              }}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "var(--text-dim)",
                marginTop: 16,
              }}
            >
              Built on Monad · 400ms finality
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />

      <main style={{ paddingTop: 80, maxWidth: 1100, margin: "0 auto", padding: "80px 20px 60px" }}>
        {/* Hero text */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5, duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48, paddingTop: 20 }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "0.1em",
              lineHeight: 1.1,
              marginBottom: 12,
            }}
          >
            Choose a side. Win the yield.{" "}
            <span style={{ color: "var(--gold)", textShadow: "0 0 15px rgba(255,215,0,0.3)" }}>
              Keep your money.
            </span>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1.05rem",
              color: "var(--text-secondary)",
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Stake mUSDC on your champion. Your principal is 100% safe — only the yield is at war. 
            Winner takes all the yield. Losers get their money back.
          </p>
        </motion.section>

        {/* Faucet */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}
        >
          <FaucetButton />
        </motion.div>

        {/* War selector (if multiple) */}
        {warCount > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.2 }}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {Array.from({ length: warCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveWarId(i)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  padding: "6px 16px",
                  borderRadius: 4,
                  border: activeWarId === i ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                  background: activeWarId === i ? "rgba(255,215,0,0.1)" : "var(--bg-card)",
                  color: activeWarId === i ? "var(--gold)" : "var(--text-dim)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Campaign #{i}
              </button>
            ))}
          </motion.div>
        )}

        {/* Main content */}
        {hasWar ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4 }}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {/* Arena */}
            <TugOfWarArena
              nameA={war.nameA}
              nameB={war.nameB}
              tvlA={war.tvlA}
              tvlB={war.tvlB}
              pctA={tugPosition ? Number(tugPosition[0]) : 5000}
              pctB={tugPosition ? Number(tugPosition[1]) : 5000}
              status={Number(war.status)}
              winningSide={Number(war.winningSide)}
              yieldBps={Number(war.mockYieldBps)}
              totalDeposits={war.totalDeposits}
            />

            {/* War info + Action panel side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <WarInfo
                warId={activeWarId}
                nameA={war.nameA}
                nameB={war.nameB}
                startTime={Number(war.startTime)}
                endTime={Number(war.endTime)}
                status={Number(war.status)}
                participantCount={Number(war.participantCount)}
                totalDeposits={war.totalDeposits}
                yieldBps={Number(war.mockYieldBps)}
                totalYield={war.totalYield}
              />

              <ActionPanel
                warId={activeWarId}
                nameA={war.nameA}
                nameB={war.nameB}
                isOpen={!!isOpen}
                status={Number(war.status)}
                winningSide={Number(war.winningSide)}
              />
            </div>

            {/* Victory Crate section */}
            {hasCrate && isWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", letterSpacing: "0.12em", color: "var(--gold)", marginBottom: 12, textAlign: "center" }}>
                  🎁 YOUR VICTORY CRATE
                </div>
                <VictoryCrate
                  yieldAmount={crateYield ?? BigInt(0)}
                  isOpened={!!crateOpened}
                  onOpen={() => {}}
                  isOpening={false}
                />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4 }}
            style={{
              textAlign: "center",
              padding: 60,
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "0.12em", color: "var(--text-dim)", marginBottom: 12 }}>
              NO ACTIVE CAMPAIGNS
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-dim)" }}>
              Admin needs to create a campaign to start the war.
            </div>
          </motion.div>
        )}

        {/* Admin panel (only shows for owner) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5 }}
          style={{ marginTop: 32 }}
        >
          <AdminPanel />
        </motion.div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 60,
            paddingTop: 24,
            borderTop: "1px solid var(--border-subtle)",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
            TARIK · Lossless Yield Wars · Built on{" "}
            <span style={{ color: "var(--text-secondary)" }}>Monad</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginTop: 4 }}>
            Principal 100% safe · Winner takes all yield · {new Date().getFullYear()}
          </div>
        </footer>
      </main>
    </div>
  );
}
