"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import Logo from "@/app/_icons/logo";
import { useBreakpoints } from "@/app/_shared/utils/use-breakpoints";
import { HEADERS, RARITY, WEIGHTED_RARITY } from "./headers";
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
    text: typeof text === "string" ? text : "Hello",
  };
};

const NavbarContainer = () => {
  const { isMdScreen } = useBreakpoints();
  const pathname = usePathname();

  const derivedHeader = useMemo(() => (pathname && HEADERS[pathname] ? pickHeader(pathname) : null), [pathname]);

  const [override, setOverride] = useState<{ pathname: string; header: Header } | null>(null);

  const header = override?.pathname === pathname ? override.header : derivedHeader;

  const onClick = () => {
    if (!pathname || !HEADERS[pathname]) return;
    setOverride({ header: pickHeader(pathname), pathname });
  };

  if (!isMdScreen || !header) {
    return null;
  }

  return (
    <Navbar
      bottomSlot={
        <div
          className={clsx("size-3 cursor-pointer rounded-full", {
            "bg-gray-300 shadow-[0_0_4px_1px_rgba(209,213,219,0.8),0_0_12px_3px_rgba(209,213,219,0.5),0_0_24px_6px_rgba(209,213,219,0.3)]":
              header.rarity === RARITY.Uncommon,
            "bg-yellow-300 shadow-[0_0_4px_1px_rgba(253,224,71,0.9),0_0_12px_3px_rgba(253,224,71,0.6),0_0_24px_6px_rgba(253,224,71,0.3),0_0_40px_10px_rgba(253,224,71,0.15)]":
              header.rarity === RARITY.Rare,
            "border border-white/20 bg-gray-700/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]":
              header.rarity === RARITY.Common,
          })}
          onClick={onClick}
        />
      }
      header={header.text}
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

export default NavbarContainer;
