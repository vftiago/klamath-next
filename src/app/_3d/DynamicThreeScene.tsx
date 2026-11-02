"use client";

import dynamic from "next/dynamic";

const DynamicThreeScene = dynamic(() => import("./ThreeScene"), {
  ssr: false,
});

export default DynamicThreeScene;
