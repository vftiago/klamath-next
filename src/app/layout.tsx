import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Barlow_Condensed, Orbitron, Roboto_Condensed } from "next/font/google";
import DynamicThreeScene from "./_3d/DynamicThreeScene";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  weight: ["400"],
});

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  variable: "--font-roboto-condensed-face",
  weight: ["300"],
});

// the neon signs' Latin face; only drawn into the text atlas, which waits for it, so not preloaded
const orbitron = Orbitron({ preload: false, subsets: ["latin"], variable: "--font-orbitron", weight: ["700"] });

export const metadata: Metadata = {
  description: "Software Engineer",
  title: {
    default: "Tiago Fernandes",
    template: "%s | Tiago Fernandes",
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en">
      <body
        className={`${barlowCondensed.variable} ${robotoCondensed.variable} ${orbitron.variable} font-roboto-condensed antialiased`}
      >
        <DynamicThreeScene />
        <div className="flex min-h-[100dvh]">{children}</div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
};

export default RootLayout;
