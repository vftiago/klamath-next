"use client";

import React, { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorWidget from "./error-widget";

export default function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorWidget message={error.message ?? "Something went wrong."} retry={resetErrorBoundary} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
