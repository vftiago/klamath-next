"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "motion/react";
import Typed from "typed.js";
import { usePathname } from "next/navigation";

import GlassPanel from "../_shared/ui/glass-panel";

import { WEIGHTED_HEADERS } from "./headers";

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
  bottomSlot?: ReactNode;
};

const Navbar = ({ topSlot, bottomSlot }: NavbarProps) => {
  const pathname = usePathname();

  const [currentHeader, setCurrentHeader] = useState<string>("Hello");

  useEffect(() => {
    const pickedHeader = WEIGHTED_HEADERS[pathname].pick();

    setCurrentHeader(pickedHeader);
  }, [pathname]);

  useEffect(() => {
    if (currentHeader) {
      const typedCurrentPageHeader = new Typed("#header", {
        strings: [currentHeader],
        typeSpeed: 20,
        showCursor: false,
      });

      return () => {
        typedCurrentPageHeader.destroy();
      };
    }
  }, [currentHeader]);

  return (
    <motion.div initial="hidden" animate="visible" variants={DIV_VARIANTS} className="fixed top-0 z-10 h-full">
      <GlassPanel rootClassName="fixed flex items-center justify-between h-full flex-col w-16">
        <div className="flex size-16 items-center justify-center">{topSlot}</div>
        <p aria-hidden="true" id="header" className="w-[100vh] -rotate-90 text-center"></p>
        <p className="sr-only">{currentHeader}</p>
        <div className="flex size-16 items-center justify-center">{bottomSlot}</div>
      </GlassPanel>
    </motion.div>
  );
};

export default Navbar;
