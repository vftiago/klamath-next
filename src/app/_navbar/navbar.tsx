"use client";

import { ReactNode, useEffect } from "react";
import Typed from "typed.js";
import { motion } from "motion/react";

import GlassPanel from "../_shared/ui/glass-panel";

const DIV_VARIANTS = {
  visible: {
    x: 0,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "backInOut",
    },
  },
  hidden: { x: -64 },
};

type NavbarProps = {
  topSlot?: ReactNode;
  header?: string;
  bottomSlot?: ReactNode;
};

const Navbar = ({ topSlot, header, bottomSlot }: NavbarProps) => {
  useEffect(() => {
    if (header) {
      const typedCurrentPageHeader = new Typed("#header", {
        strings: [header],
        typeSpeed: 20,
        cursorChar: "_",
      });

      return () => {
        typedCurrentPageHeader.destroy();
      };
    }
  }, [header]);

  return (
    <motion.div initial="hidden" animate="visible" variants={DIV_VARIANTS} className="fixed top-0 z-10 h-full">
      <GlassPanel rootClassName="fixed flex items-center justify-between h-full flex-col z-10 w-16 border-r">
        <div className="flex size-16 items-center justify-center fill-white">{topSlot}</div>
        <div className="flex -rotate-180 text-center font-electrolize text-lg [writing-mode:vertical-lr]">
          <p aria-hidden="true" id="header"></p>
          <p className="sr-only">{header}</p>
        </div>
        <div className="flex size-16 items-center justify-center">{bottomSlot}</div>
      </GlassPanel>
    </motion.div>
  );
};

export default Navbar;
