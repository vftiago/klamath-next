import React from "react";

type ErrorWidgetProps = {
  message: string;
  retry?: () => void;
};

const ErrorWidget = ({ message, retry }: ErrorWidgetProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl">{message}</h1>
      {retry && (
        <button
          onClick={retry}
          className="flex items-center justify-center border border-neutral-500/20 bg-neutral-100/20 px-4 py-1 text-lg outline-none backdrop-blur-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorWidget;
