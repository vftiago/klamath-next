import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";

import "./globals.css";
import Navbar from "@/components/Navbar";
import Logo from "@/components/icons/Logo";
import DynamicThreeScene from "@/3d/DynamicThreeScene";

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  variable: "--font-roboto-condensed",
  weight: ["300"],
});

export const metadata: Metadata = {
  title: "Tiago Fernandes",
  description: "Software Engineer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${robotoCondensed.variable} font-sans antialiased`}>
        <DynamicThreeScene />
        <Navbar leftIcon={<Logo />} header="This is a website" />
        <div className="flex h-full px-16">{children}</div>
      </body>
    </html>
  );
}
