import { ReactNode } from "react";
import { clsx } from "clsx";

export type GlassPanelProps = {
  children: ReactNode;
  rootClassName?: string;
};

const GlassPanel = ({ rootClassName, children }: GlassPanelProps) => {
  return <div className={clsx(["rounded-xl border border-white/20 bg-gray-500/10", rootClassName])}>{children}</div>;
};

export default GlassPanel;
