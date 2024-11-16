import { ReactNode } from "react";
import { clsx } from "clsx";

export type GlassPanelProps = {
  children: ReactNode;
  rootClassName?: string;
};

const GlassPanel = ({ rootClassName, children }: GlassPanelProps) => {
  return (
    <div className={clsx(["bg-neutral-100/20shadow-lg border border-neutral-500/20 backdrop-blur-sm", rootClassName])}>
      {children}
    </div>
  );
};

export default GlassPanel;
