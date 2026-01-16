import { clsx } from "clsx";
import type { ReactNode } from "react";

export type GlassPanelProps = {
  children: ReactNode;
  rootClassName?: string;
};

const GlassPanel = ({ children, rootClassName }: GlassPanelProps) => {
  return <div className={clsx(["rounded-xl border border-white/20 bg-gray-500/10", rootClassName])}>{children}</div>;
};

export default GlassPanel;
