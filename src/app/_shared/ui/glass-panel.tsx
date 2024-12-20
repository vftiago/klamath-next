import { ReactNode } from "react";
import { clsx } from "clsx";

export type GlassPanelProps = {
  children: ReactNode;
  rootClassName?: string;
};

const GlassPanel = ({ rootClassName, children }: GlassPanelProps) => {
  return (
    <div className={clsx(["border border-neutral-500/20 bg-neutral-100/20 shadow-lg backdrop-blur-sm", rootClassName])}>
      {children}
    </div>
  );
};

export default GlassPanel;
