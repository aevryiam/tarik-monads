// ============================================================================
// config/constants.ts — Magic numbers dan konstanta global
// ============================================================================

/** Jumlah desimal MockUSDC (sama seperti USDC asli) */
export const USDC_DECIMALS = 6;

/** Interval refetch dalam milidetik.
 *  Monad block time = 400ms, jadi polling setiap 4s sudah cukup responsif.
 */
export const REFETCH_INTERVAL = {
  /** Untuk data yang berubah cepat (TVL, posisi tug-of-war) */
  fast: 4_000,
  /** Untuk data user (deposit, allowance) */
  normal: 8_000,
  /** Untuk data yang jarang berubah (faucet time, crate status) */
  slow: 15_000,
} as const;

/** Faucet amount dari kontrak: 10,000 mUSDC */
export const FAUCET_AMOUNT = BigInt(10_000 * 10 ** USDC_DECIMALS);

/** Faucet cooldown dari kontrak: 1 jam (dalam detik) */
export const FAUCET_COOLDOWN_SECONDS = 3600;

/** Chain ID Monad Testnet */
export const MONAD_TESTNET_CHAIN_ID = 10143;
