"use client";

import dynamic from "next/dynamic";

const DynamicThreeScene = dynamic(() => import("@/3d/ThreeScene"), {
  ssr: false,
});

export default DynamicThreeScene;
