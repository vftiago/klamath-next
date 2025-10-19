"use client";

import dynamic from "next/dynamic";

const DynamicThreeScene = dynamic(() => import("./ThreeScene"), {
  ssr: false,
  loading: () => (
    <div className="abstract-bg fixed -z-10 h-screen w-full">
      <div className="dot-grid" />
    </div>
  ),
});

export default DynamicThreeScene;
