import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Las fotos ya se guardan livianas (WebP de ~50 KB). Pasarlas por el optimizador
  // de Vercel solo agregaba demora la primera vez y gastaba el cupo del plan.
  images: { unoptimized: true },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
