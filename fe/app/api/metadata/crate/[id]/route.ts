import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tokenId = parseInt(id, 10);

  // Rarity is decorative / off-chain — randomized per token for fun
  const seed = tokenId * 7 + 42;
  const roll = seed % 100;
  let rarity: string;
  let tier: string;
  if (roll < 1) {
    rarity = "SSR";
    tier = "Legendary";
  } else if (roll < 10) {
    rarity = "Rare";
    tier = "Epic";
  } else {
    rarity = "Common";
    tier = "Standard";
  }

  const metadata = {
    name: `Victory Crate #${tokenId}`,
    description: `A ${rarity} Victory Crate from TARIK Yield War #${tokenId}. Open it to claim your yield!`,
    image: `https://placehold.co/400x400/181a25/ffd700?text=CRATE+%23${tokenId}`,
    attributes: [
      { trait_type: "War ID", value: tokenId },
      { trait_type: "Rarity", value: rarity },
      { trait_type: "Tier", value: tier },
    ],
  };

  return NextResponse.json(metadata, {
    headers: { "Cache-Control": "public, s-maxage=3600" },
  });
}
