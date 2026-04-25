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
    "0xA048f32a432F6CA02321227Ae36Fa20e114c1661"
  ) as `0x${string}`,

  tarikVault: (
    process.env.NEXT_PUBLIC_TARIK_VAULT_ADDRESS ||
    "0xa953E73F030b1E533DBf8d063eB740df451d111D"
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
