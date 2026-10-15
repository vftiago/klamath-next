"use client";

import dynamic from "next/dynamic";

const DynamicThreeScene = dynamic(() => import("./ThreeScene"), {
  loading: () => <div className="abstract-bg fixed -z-10 h-screen w-full" />,
  ssr: false,
});

export default DynamicThreeScene;
