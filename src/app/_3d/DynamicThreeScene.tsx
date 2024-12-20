"use client";

import dynamic from "next/dynamic";

const DynamicThreeScene = dynamic(() => import("@/app/_3d/ThreeScene"), {
  ssr: false,
});

export default DynamicThreeScene;
