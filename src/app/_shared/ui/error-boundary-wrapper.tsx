"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import React, { startTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorWidget from "./error-widget";

export default function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <ErrorWidget
          message="Something went wrong while loading this data."
          retry={() => {
            // refresh refetches the errored server component payload; reset alone would replay the same error
            startTransition(() => {
              router.refresh();
              resetErrorBoundary();
            });
          }}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
