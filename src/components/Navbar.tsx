"use client";

import { useEffect, ReactNode } from "react";
import { motion } from "motion/react";
import Typed from "typed.js";

import GlassPanel from "./GlassPanel";

type NavbarProps = {
  header?: string;
  size?: number;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const Navbar = ({ header, leftIcon, rightIcon }: NavbarProps) => {
  useEffect(() => {
    if (!header) return;

    const typedCurrentPageHeader = new Typed("#header", {
      strings: [header],
      typeSpeed: 20,
      showCursor: false,
    });

    return () => {
      typedCurrentPageHeader.destroy();
    };
  }, [header]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          x: 0,
          y: 0,
          transition: {
            duration: 0.8,
            ease: "backInOut",
          },
        },
        hidden: { x: "-64px" },
      }}
      className="fixed top-0 z-10 h-full"
    >
      <GlassPanel rootClassName="fixed flex items-center justify-between h-full flex-col w-16">
        <div className="flex size-16 items-center justify-center">
          <div className="size-8">{leftIcon}</div>
        </div>
        <p aria-hidden="true" id="header" className="w-[100vh] -rotate-90 text-center"></p>
        <p className="sr-only">{header}</p>
        <div className="flex size-16 items-center justify-center">{rightIcon}</div>
      </GlassPanel>
    </motion.div>
  );
};

export default Navbar;
