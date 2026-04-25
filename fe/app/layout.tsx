import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/app/components/Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "TARIK — Lossless Yield Wars on Monad",
  description: "Pick a side. Win the yield. Keep your money. Gamified DeFi tug-of-war battles on Monad.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col noise-overlay">
        <Providers>{children}</Providers>
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "var(--bg-card)",
              border: "1px solid var(--border-medium)",
              fontFamily: "var(--font-body)",
            },
          }}
        />
      </body>
    </html>
  );
}

