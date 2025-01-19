import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Roboto_Condensed } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className="size-full">
      <body className={`${robotoCondensed.variable} size-full font-sans antialiased`}>
        <DynamicThreeScene />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
};

export default RootLayout;
