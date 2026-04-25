// ============================================================================
// config/addresses.ts — Contract addresses dibaca dari env vars
// ============================================================================

/**
 * Semua contract addresses dibaca dari NEXT_PUBLIC_ env vars.
 * Ganti fallback ini setelah redeploy native MON contracts.
 */
export const ADDRESSES = {
  victoryCrate: (
    process.env.NEXT_PUBLIC_VICTORY_CRATE_ADDRESS ||
    "0xB0db5f8fC40fb199Db8597c68feceFa586088CbE"
  ) as `0x${string}`,

  tarikVault: (
    process.env.NEXT_PUBLIC_TARIK_VAULT_ADDRESS ||
    "0x6604f0429E9f9FE0b57Ae0F0167E2caE2c5f2cc3"
  ) as `0x${string}`,
} as const;

/**
 * Admin/owner address — digunakan di frontend untuk menampilkan
 * Admin Panel (bukan untuk keperluan signing/private key).
 */
export const OWNER_ADDRESS = (
  process.env.NEXT_PUBLIC_OWNER_ADDRESS ||
  "0x8B35e6241D00Fa03C7b36e923b41590bb6B94478"
) as `0x${string}`;
