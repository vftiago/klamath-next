"use client";

import type { ReactNode} from "react";
import { useEffect } from "react";
import Typed from "typed.js";
import GlassPanel from "../_shared/ui/glass-panel";

type NavbarProps = {
  bottomSlot?: ReactNode;
  header?: string;
  topSlot?: ReactNode;
};

const Navbar = ({ bottomSlot, header, topSlot }: NavbarProps) => {
  useEffect(() => {
    if (header) {
      const typedCurrentPageHeader = new Typed("#header", {
        cursorChar: "_",
        strings: [header],
        typeSpeed: 20,
      });

      return () => {
        typedCurrentPageHeader.destroy();
      };
    }
  }, [header]);

  return (
    <GlassPanel rootClassName="flex h-full items-center justify-between flex-col z-10 w-16">
      <div className="flex size-16 items-center justify-center fill-white">{topSlot}</div>
      <div className="flex -rotate-180 text-center font-electrolize text-lg [writing-mode:vertical-lr]">
        <p aria-hidden="true" id="header"></p>
        <p className="sr-only">{header}</p>
      </div>
      <div className="flex size-16 items-center justify-center">{bottomSlot}</div>
    </GlassPanel>
  );
};

export default Navbar;
