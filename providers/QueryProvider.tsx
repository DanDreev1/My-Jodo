// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthCacheGuard } from "./AuthCacheGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: "always",
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <AuthCacheGuard />
      {children}
    </QueryClientProvider>
  );
}
