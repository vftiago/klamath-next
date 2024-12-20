"use client";

import Link from "next/link";

import Navbar from "./navbar";

import { useBreakpoints } from "@/app/_shared/utils/use-breakpoints";
import Logo from "@/app/_icons/logo";

const NavbarContainer = () => {
  const { isMdScreen } = useBreakpoints();

  if (!isMdScreen) {
    return null;
  }

  return (
    <Navbar
      topSlot={
        <Link href="/" className="z-10">
          <div className="size-8">
            <Logo />
          </div>
        </Link>
      }
    />
  );
};

export default NavbarContainer;
