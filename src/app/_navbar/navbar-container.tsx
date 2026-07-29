"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/app/_icons/logo";
import { useBreakpoints } from "@/app/_shared/utils/use-breakpoints";
import { HEADERS, RARITY, resolveHeader, WEIGHTED_RARITY } from "./headers";
import Navbar from "./navbar";
import { pick } from "./utils";

type Header = {
  rarity: RARITY;
  text: string;
};

const pickHeader = (pathname: string): Header => {
  const rarity = WEIGHTED_RARITY.pick() ?? RARITY.Common;
  const text = pick(HEADERS[pathname]?.[rarity]);

  return {
    rarity,
    text: typeof text === "string" ? resolveHeader(text) : "Hello",
  };
};

const NavbarHeader = ({ pathname }: { pathname: string }) => {
  const [picked, setPicked] = useState(() => ({ header: pickHeader(pathname), nonce: 0 }));

  const onClick = () => {
    // the nonce forces the typing effect to restart even when the same header is re-picked
    setPicked((prev) => ({ header: pickHeader(pathname), nonce: prev.nonce + 1 }));
  };

  return (
    <Navbar
      bottomSlot={
        <div
          className={clsx("size-3 cursor-pointer rounded-full", {
            "bg-gray-300 shadow-[0_0_4px_1px_rgba(209,213,219,0.8),0_0_12px_3px_rgba(209,213,219,0.5),0_0_24px_6px_rgba(209,213,219,0.3)]":
              picked.header.rarity === RARITY.Uncommon,
            "bg-yellow-300 shadow-[0_0_4px_1px_rgba(253,224,71,0.9),0_0_12px_3px_rgba(253,224,71,0.6),0_0_24px_6px_rgba(253,224,71,0.3),0_0_40px_10px_rgba(253,224,71,0.15)]":
              picked.header.rarity === RARITY.Rare,
            "border border-white/20 bg-gray-700/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]":
              picked.header.rarity === RARITY.Common,
          })}
          onClick={onClick}
        />
      }
      header={picked.header.text}
      headerNonce={picked.nonce}
      topSlot={
        <Link className="z-10" href="/">
          <div className="size-8">
            <Logo />
          </div>
        </Link>
      }
    />
  );
};

const NavbarContainer = () => {
  const { isMdScreen } = useBreakpoints();
  const pathname = usePathname();

  if (!isMdScreen || !HEADERS[pathname]) {
    return null;
  }

  // keying by pathname remounts the header so each route gets a fresh pick without effects
  return <NavbarHeader key={pathname} pathname={pathname} />;
};

export default NavbarContainer;
