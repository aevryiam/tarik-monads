// ============================================================================
// lib/errors.ts — Contract error parser → pesan user-friendly
// ============================================================================

/**
 * Map custom Solidity error names ke pesan yang bisa dibaca user.
 */
const CONTRACT_ERRORS: Record<string, string> = {
  // TarikVault errors
  InvalidSide: "Pilihan sisi tidak valid. Pilih Side A atau Side B.",
  WarNotActive: "War ini belum aktif atau sudah selesai.",
  WarNotResolved: "War belum selesai. Tunggu owner menyelesaikan war.",
  WarNotCancelledOrResolved: "War belum selesai atau dibatalkan.",
  DepositWindowClosed: "Waktu deposit sudah berakhir.",
  DepositWindowOpen: "Waktu deposit masih berjalan. Resolusi belum bisa dilakukan.",
  ZeroAmount: "Jumlah harus lebih dari 0.",
  AlreadyClaimed: "Kamu sudah mengklaim principal untuk war ini.",
  AlreadyClaimedYield: "Kamu sudah membuka crate dan mengklaim yield.",
  NoDeposit: "Kamu tidak punya deposit di war ini.",
  NotWinner: "Hanya pemenang yang bisa membuka Victory Crate.",
  InvalidTimeRange: "Waktu mulai harus lebih awal dari waktu selesai.",
  VictoryCrateNotSet: "Kontrak Victory Crate belum dikonfigurasi oleh admin.",
  WarAlreadyResolved: "War ini sudah diselesaikan atau dibatalkan.",
  InvalidYieldBps: "Yield BPS tidak valid (harus antara 1 dan 10000).",
  InvalidMsgValue: "Jumlah MON yang dikirim tidak sesuai dengan input deposit.",
  NativeTransferFailed: "Transfer MON gagal. Coba lagi atau cek wallet tujuan.",

  // VictoryCrate errors
  OnlyMinter: "Hanya vault yang bisa mint crate.",
  CrateAlreadyOpened: "Crate ini sudah dibuka sebelumnya.",
  NoCrateOwned: "Kamu tidak punya crate untuk round ini.",

  // Generic
  OwnableUnauthorizedAccount: "Kamu bukan owner kontrak ini.",
  ReentrancyGuardReentrantCall: "Transaksi gagal: reentrant call terdeteksi.",
};

/**
 * Parsing error dari wagmi/viem menjadi pesan user-friendly.
 * Menerima Error object atau string.
 */
export function parseContractError(error: unknown): string {
  if (!error) return "Terjadi kesalahan yang tidak diketahui.";

  const message = error instanceof Error ? error.message : String(error);

  // Cari nama error custom di pesan
  for (const [errorName, userMessage] of Object.entries(CONTRACT_ERRORS)) {
    if (message.includes(errorName)) {
      return userMessage;
    }
  }

  // User menolak transaksi di wallet
  if (
    message.includes("User rejected") ||
    message.includes("user rejected") ||
    message.includes("ACTION_REJECTED")
  ) {
    return "Transaksi dibatalkan oleh pengguna.";
  }

  // Insufficient funds
  if (message.includes("insufficient funds")) {
    return "Saldo MON tidak cukup untuk membayar gas.";
  }

  // Network error
  if (message.includes("network") || message.includes("Network")) {
    return "Terjadi masalah jaringan. Pastikan kamu terhubung ke Monad Testnet.";
  }

  // Default: kembalikan 60 karakter pertama dari pesan asli
  return `Error: ${message.slice(0, 80)}`;
}
