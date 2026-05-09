"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

import { AppHttpError } from "@/lib/http/api-client";
import { toastApiError } from "@/lib/http/toast-error";

function handleQueryError(error: unknown) {
  if (error instanceof AppHttpError) {
    toastApiError(error.normalized);
    return;
  }
  toastApiError({
    code: "UNEXPECTED_CLIENT",
    status: 0,
    retryable: true,
    title: "Something went wrong",
    description: "Please try again. Contact support if this continues.",
  });
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error: unknown) => {
          if (error instanceof AppHttpError && !error.normalized.retryable) return false;
          return failureCount < 2;
        },
      },
    },
    mutationCache: new MutationCache({
      onError: handleQueryError,
    }),
  });
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
