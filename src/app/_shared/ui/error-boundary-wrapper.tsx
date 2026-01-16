"use client";

import type { ReactNode } from "react";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorWidget from "./error-widget";

export default function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorWidget
          message={error instanceof Error ? error.message : "Something went wrong."}
          retry={resetErrorBoundary}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
