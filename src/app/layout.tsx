import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Barlow_Condensed, Electrolize, Roboto_Condensed } from "next/font/google";
import "./globals.css";

import ThreeScene from "./_3d/ThreeScene";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  weight: ["400"],
});

const electrolize = Electrolize({
  subsets: ["latin"],
  variable: "--font-electrolize",
  weight: ["400"],
});

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
      <head>
        {/* remove when Chrome 139 is releasted in August 5: https://github.com/Zwyx/chrome-android-clientheight?tab=readme-ov-file */}
        <meta name="viewport" content="interactive-widget=resizes-content" />
      </head>
      <body
        className={`${barlowCondensed.variable} ${robotoCondensed.variable} ${electrolize.variable} font-roboto-condensed antialiased`}
      >
        <ThreeScene />
        <div className="flex min-h-[100dvh]">{children}</div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
};

export default RootLayout;
