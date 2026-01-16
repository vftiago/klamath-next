"use client";

import { useEffect } from "react";
import ErrorWidget from "./_shared/ui/error-widget";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-2xl">
      <ErrorWidget message="Something went wrong while loading this page." retry={reset} />
    </div>
  );
}
