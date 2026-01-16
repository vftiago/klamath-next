import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

type WebpackConfig = {
  module: {
    rules: unknown[];
  };
};

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.frag": {
        as: "*.js",
        loaders: ["raw-loader", "glslify-loader"],
      },
      "*.vert": {
        as: "*.js",
        loaders: ["raw-loader", "glslify-loader"],
      },
    },
  },

  webpack: (config: WebpackConfig) => {
    config.module.rules.push({
      test: /\.(vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
    });

    return config;
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
