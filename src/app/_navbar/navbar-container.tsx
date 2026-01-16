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
          className={clsx("size-3 cursor-pointer rounded-full border", {
            "bg-gray-400": header.rarity === RARITY.Uncommon,
            "bg-yellow-400": header.rarity === RARITY.Rare,
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
