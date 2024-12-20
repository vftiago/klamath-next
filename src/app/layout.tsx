import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
import "./globals.css";

import Navbar from "./_navbar";

import DynamicThreeScene from "@/app/_3d/DynamicThreeScene";

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  variable: "--font-roboto-condensed",
  weight: ["300"],
});

export const metadata: Metadata = {
  title: "Tiago Fernandes",
  description: "Software Engineer",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en">
      <body className={`${robotoCondensed.variable} font-sans antialiased`}>
        <DynamicThreeScene />
        <Navbar />
        <div className="flex h-full md:px-16">
          <div className="p-4">{children}</div>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
