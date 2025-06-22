import { ReactNode } from "react";
import { clsx } from "clsx";

export type GlassPanelProps = {
  children: ReactNode;
  rootClassName?: string;
};

const GlassPanel = ({ rootClassName, children }: GlassPanelProps) => {
  return <div className={clsx(["bg-gray-500/10", rootClassName])}>{children}</div>;
};

export default GlassPanel;
