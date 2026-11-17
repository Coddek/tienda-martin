import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Las fotos ya se guardan livianas (WebP de ~50 KB). Pasarlas por el optimizador
  // de Vercel solo agregaba demora la primera vez y gastaba el cupo del plan.
  // Las fotos que suben desde el editor viven en Supabase Storage (bucket tienda-fotos).
  images: {
    unoptimized: true,
    remotePatterns: [new URL("https://*.supabase.co/storage/v1/object/public/tienda-fotos/**")],
  },
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
