"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { WagmiProvider as WagmiFallbackProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, monadTestnet } from "@/app/config/web3";
import { type ReactNode, useState } from "react";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

function PrivyEnabledProviders({ children, queryClient }: { children: ReactNode; queryClient: QueryClient }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#e63946",
          logo: undefined,
          landingHeader: "Welcome to TARIK",
          loginMessage: "Lossless Yield Wars on Monad",
        },
        loginMethods: ["google", "email", "wallet"],
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

function FallbackProviders({ children, queryClient }: { children: ReactNode; queryClient: QueryClient }) {
  return (
    <WagmiFallbackProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiFallbackProvider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // Use Privy when a valid App ID is set, otherwise fallback to plain wagmi
  if (PRIVY_APP_ID && PRIVY_APP_ID.startsWith("cl")) {
    return (
      <PrivyEnabledProviders queryClient={queryClient}>
        {children}
      </PrivyEnabledProviders>
    );
  }

  return (
    <FallbackProviders queryClient={queryClient}>
      {children}
    </FallbackProviders>
  );
}

// Re-export so other components can check
export const isPrivyEnabled = !!PRIVY_APP_ID && PRIVY_APP_ID.startsWith("cl");
