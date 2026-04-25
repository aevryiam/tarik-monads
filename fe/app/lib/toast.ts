// ============================================================================
// lib/toast.ts — Wrapper helpers untuk sonner toast + explorer links
// ============================================================================

import { toast } from "sonner";

const EXPLORER_URL =
  process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "https://testnet.monadscan.com";

/** Tampilkan toast sukses dengan opsional link ke block explorer */
export function toastSuccess(message: string, txHash?: `0x${string}`) {
  const explorerLink = txHash
    ? `${EXPLORER_URL}/tx/${txHash}`
    : undefined;

  toast.success(message, {
    description: explorerLink ? (
      `Lihat transaksi di explorer →`
    ) : undefined,
    action: explorerLink
      ? {
          label: "View Tx",
          onClick: () => window.open(explorerLink, "_blank"),
        }
      : undefined,
    duration: 5000,
  });
}

/** Tampilkan toast error dengan pesan yang sudah di-parse */
export function toastError(message: string) {
  toast.error(message, { duration: 6000 });
}

/** Tampilkan toast loading/pending */
export function toastPending(message: string): string | number {
  return toast.loading(message);
}

/** Dismiss toast berdasarkan ID */
export function toastDismiss(id: string | number) {
  toast.dismiss(id);
}

/** Tampilkan toast info biasa */
export function toastInfo(message: string) {
  toast.info(message, { duration: 4000 });
}
