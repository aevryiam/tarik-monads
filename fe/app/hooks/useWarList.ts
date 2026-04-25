// ============================================================================
// hooks/useWarList.ts — Hook untuk membaca daftar semua wars
// ============================================================================
"use client";

import { useQuery } from "@tanstack/react-query";
import { REFETCH_INTERVAL } from "@/app/config/constants";
import { WarStatus } from "@/app/types/contracts";
import type { War, WarWithId } from "@/app/types/contracts";

interface UseWarListResult {
  warCount: number;
  wars: WarWithId[];
  /** Wars yang masih aktif (status Active), termasuk yang menunggu resolusi */
  activeWars: WarWithId[];
  /** Wars yang sudah Resolved atau Cancelled */
  resolvedWars: WarWithId[];
  isLoading: boolean;
  refetch: () => void;
}

interface ApiWarRow {
  id: number;
  nameA: string;
  nameB: string;
  startTime: number;
  endTime: number;
  tvlA: string;
  tvlB: string;
  totalDeposits: string;
  mockYieldBps: number;
  totalYield: string;
  winningSide: number;
  status: number;
  participantCount: number;
}

interface ApiWarsResponse {
  wars: ApiWarRow[];
  total: number;
}

function mapApiWarToWarWithId(row: ApiWarRow): WarWithId {
  const war: War = {
    nameA: row.nameA,
    nameB: row.nameB,
    startTime: BigInt(row.startTime),
    endTime: BigInt(row.endTime),
    tvlA: BigInt(row.tvlA),
    tvlB: BigInt(row.tvlB),
    totalDeposits: BigInt(row.totalDeposits),
    mockYieldBps: BigInt(row.mockYieldBps),
    totalYield: BigInt(row.totalYield),
    winningSide: row.winningSide,
    status: row.status as WarStatus,
    participantCount: BigInt(row.participantCount),
  };

  return {
    ...war,
    warId: row.id,
  };
}

/**
 * Membaca daftar war melalui backend API.
 * Endpoint server membaca on-chain data sehingga UI tetap stabil
 * walau provider/client RPC di browser bermasalah.
 */
export function useWarList(): UseWarListResult {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wars", "api"],
    queryFn: async (): Promise<ApiWarsResponse> => {
      const res = await fetch("/api/wars", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to fetch wars from API: ${res.status}`);
      }
      return (await res.json()) as ApiWarsResponse;
    },
    refetchInterval: REFETCH_INTERVAL.normal,
    placeholderData: {
      wars: [],
      total: 0,
    },
  });

  const wars: WarWithId[] = (data?.wars ?? []).map(mapApiWarToWarWithId);
  const warCount = data?.total ?? 0;

  const activeWars = wars.filter((w) => w.status === WarStatus.Active);

  const resolvedWars = wars.filter(
    (w) => w.status === WarStatus.Resolved || w.status === WarStatus.Cancelled,
  );

  return {
    warCount,
    wars,
    activeWars,
    resolvedWars,
    isLoading,
    refetch: () => {
      void refetch();
    },
  };
}
