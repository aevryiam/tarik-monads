import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { ADDRESSES, TARIK_VAULT_ABI } from "@/app/config/contracts";

const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
} as const;

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

export async function GET() {
  try {
    const currentWarId = await client.readContract({
      address: ADDRESSES.tarikVault,
      abi: TARIK_VAULT_ABI,
      functionName: "currentWarId",
    });

    const warCount = Number(currentWarId);
    const wars = [];

    for (let i = 0; i < warCount; i++) {
      const war = await client.readContract({
        address: ADDRESSES.tarikVault,
        abi: TARIK_VAULT_ABI,
        functionName: "getWar",
        args: [BigInt(i)],
      });

      const [pctA, pctB] = await client.readContract({
        address: ADDRESSES.tarikVault,
        abi: TARIK_VAULT_ABI,
        functionName: "getTugOfWarPosition",
        args: [BigInt(i)],
      });

      wars.push({
        id: i,
        nameA: war.nameA,
        nameB: war.nameB,
        startTime: Number(war.startTime),
        endTime: Number(war.endTime),
        tvlA: war.tvlA.toString(),
        tvlB: war.tvlB.toString(),
        totalDeposits: war.totalDeposits.toString(),
        mockYieldBps: Number(war.mockYieldBps),
        totalYield: war.totalYield.toString(),
        winningSide: Number(war.winningSide),
        status: Number(war.status),
        participantCount: Number(war.participantCount),
        pctA: Number(pctA),
        pctB: Number(pctB),
      });
    }

    return NextResponse.json({ wars, total: warCount }, {
      headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" },
    });
  } catch (error) {
    console.error("Error fetching wars:", error);
    return NextResponse.json({ error: "Failed to fetch wars" }, { status: 500 });
  }
}
