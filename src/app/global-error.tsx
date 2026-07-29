"use client";

import ErrorWidget from "./_shared/ui/error-widget";
import "./globals.css";

// catches errors thrown by the root layout itself, which app/error.tsx cannot reach
const GlobalError = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-dvh">
          <ErrorWidget message="Something went wrong." retry={reset} />
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
