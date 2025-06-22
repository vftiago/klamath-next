"use client";

import Link from "next/link";

import Navbar from "./navbar";

import { useBreakpoints } from "@/app/_shared/utils/use-breakpoints";
import Logo from "@/app/_icons/logo";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HEADERS, RARITY, WEIGHTED_RARITY } from "./headers";
import clsx from "clsx";
import { pick } from "./utils";

const NavbarContainer = () => {
  const { isMdScreen } = useBreakpoints();

  const pathname = usePathname();

  const [currentHeader, setCurrentHeader] = useState<string>("Hello");
  const [currentRarity, setCurrentRarity] = useState<RARITY>(RARITY.Common);

  const onClick = () => {
    const rarity = WEIGHTED_RARITY.pick();

    if (rarity) {
      setCurrentRarity(rarity);
    }

    const header = pick(HEADERS[pathname][rarity]);

    if (header && typeof header === "string") {
      setCurrentHeader(header);
    }
  };

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (!HEADERS[pathname]) {
      return;
    }

    try {
      const rarity = WEIGHTED_RARITY.pick();

      if (rarity) {
        setCurrentRarity(rarity);
      }

      const header = pick(HEADERS[pathname][rarity]);

      if (header && typeof header === "string") {
        setCurrentHeader(header);
      }
    } catch (error) {
      console.error("Error picking header:", error);
    }
  }, [pathname]);

  if (!isMdScreen) {
    return null;
  }

  return (
    <Navbar
      header={currentHeader}
      topSlot={
        <Link href="/" className="z-10">
          <div className="size-8">
            <Logo />
          </div>
        </Link>
      }
      bottomSlot={
        <div
          onClick={onClick}
          className={clsx("size-2 cursor-pointer rounded-full border", {
            "bg-gray-400": currentRarity === RARITY.Uncommon,
            "bg-yellow-400": currentRarity === RARITY.Rare,
          })}
        />
      }
    />
  );
};

export default NavbarContainer;
