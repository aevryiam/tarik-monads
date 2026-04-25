// ============================================================================
// hooks/useUserStats.ts - Aggregate user stats from TarikVault and VictoryCrate
// ============================================================================
"use client";

import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { ADDRESSES } from "@/app/config/addresses";
import { TARIK_VAULT_ABI } from "@/app/contracts/abi/TarikVault.abi";
import { VICTORY_CRATE_ABI } from "@/app/contracts/abi/VictoryCrate.abi";
import { REFETCH_INTERVAL } from "@/app/config/constants";
import { WarStatus, type UserDeposit } from "@/app/types/contracts";
import { useWarList } from "@/app/hooks/useWarList";

interface UserStats {
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  totalYield: bigint;
  victoryTokens: number;
  totalCrates: number;
  activePositions: number;
  isLoading: boolean;
}

export function useUserStats(): UserStats {
  const { address } = useAccount();
  const { wars, isLoading: warsLoading } = useWarList();

  const enabled = !!address && wars.length > 0;

  const depositContracts = useMemo(
    () => {
      if (!address) return [];
      return wars.map((war) => ({
        address: ADDRESSES.tarikVault,
        abi: TARIK_VAULT_ABI,
        functionName: "getUserDeposit" as const,
        args: [BigInt(war.warId), address] as const,
      }));
    },
    [address, wars]
  );

  const crateBalanceContracts = useMemo(
    () => {
      if (!address) return [];
      return wars.map((war) => ({
        address: ADDRESSES.victoryCrate,
        abi: VICTORY_CRATE_ABI,
        functionName: "balanceOf" as const,
        args: [address, BigInt(war.warId)] as const,
      }));
    },
    [address, wars]
  );

  const crateOpenedContracts = useMemo(
    () => {
      if (!address) return [];
      return wars.map((war) => ({
        address: ADDRESSES.victoryCrate,
        abi: VICTORY_CRATE_ABI,
        functionName: "crateOpened" as const,
        args: [BigInt(war.warId), address] as const,
      }));
    },
    [address, wars]
  );

  const { data: depositData, isLoading: depositsLoading } = useReadContracts({
    contracts: depositContracts,
    query: {
      enabled,
      refetchInterval: REFETCH_INTERVAL.normal,
    },
  });

  const { data: crateBalanceData, isLoading: crateBalanceLoading } = useReadContracts({
    contracts: crateBalanceContracts,
    query: {
      enabled,
      refetchInterval: REFETCH_INTERVAL.slow,
    },
  });

  const { data: crateOpenedData, isLoading: crateOpenedLoading } = useReadContracts({
    contracts: crateOpenedContracts,
    query: {
      enabled,
      refetchInterval: REFETCH_INTERVAL.slow,
    },
  });

  return useMemo(() => {
    let played = 0;
    let wins = 0;
    let losses = 0;
    let totalYield = BigInt(0);
    let victoryTokens = 0;
    let totalCrates = 0;
    let activePositions = 0;

    wars.forEach((war, index) => {
      const deposit = depositData?.[index]?.result as UserDeposit | undefined;
      if (!deposit || deposit.amount === BigInt(0)) return;

      if (war.status === WarStatus.Active) {
        activePositions++;
      }

      if (war.status === WarStatus.Resolved) {
        played++;
        const won = deposit.side === Number(war.winningSide);
        if (won) {
          wins++;
          const winnerTVL = Number(war.winningSide) === 1 ? war.tvlA : war.tvlB;
          if (winnerTVL > BigInt(0)) {
            totalYield += (war.totalYield * deposit.amount) / winnerTVL;
          }
        } else {
          losses++;
        }
      }

      const crateBalance = (crateBalanceData?.[index]?.result as bigint | undefined) ?? BigInt(0);
      const crateOpened = (crateOpenedData?.[index]?.result as boolean | undefined) ?? false;

      if (crateBalance > BigInt(0)) {
        const crateCount = Number(crateBalance);
        totalCrates += crateCount;
        if (!crateOpened) victoryTokens += crateCount;
      }
    });

    return {
      played,
      wins,
      losses,
      winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
      totalYield,
      victoryTokens,
      totalCrates,
      activePositions,
      isLoading: warsLoading || depositsLoading || crateBalanceLoading || crateOpenedLoading,
    };
  }, [
    crateBalanceData,
    crateBalanceLoading,
    crateOpenedData,
    crateOpenedLoading,
    depositData,
    depositsLoading,
    wars,
    warsLoading,
  ]);
}
