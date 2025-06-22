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
          className="g-gray-500/10 flex items-center justify-center border px-4 py-1 text-lg outline-none"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorWidget;
