"use client";

import dynamic from "next/dynamic";

const DynamicThreeScene = dynamic(() => import("./ThreeScene"), {
  loading: () => (
    <div className="abstract-bg fixed -z-10 h-screen w-full">
      <div className="dot-grid" />
    </div>
  ),
  ssr: false,
});

export default DynamicThreeScene;
