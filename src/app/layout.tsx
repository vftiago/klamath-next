import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Barlow_Condensed, Electrolize, Roboto_Condensed } from "next/font/google";
import DynamicThreeScene from "./_3d/DynamicThreeScene";
import "./globals.css";

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
        className={`${barlowCondensed.variable} ${robotoCondensed.variable} ${electrolize.variable} font-roboto-condensed antialiased`}
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
