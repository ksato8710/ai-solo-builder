import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      // Category slug migrations (legacy -> canonical)
      { source: "/category/morning-news", destination: "/category/morning-summary", permanent: true },
      { source: "/category/knowledge", destination: "/category/dev-knowledge", permanent: true },
      { source: "/category/product-news", destination: "/category/news", permanent: true },
      { source: "/category/tools", destination: "/category/news", permanent: true },
      { source: "/category/featured-tools", destination: "/category/dev-knowledge", permanent: true },
      { source: "/category/dev", destination: "/category/dev-knowledge", permanent: true },
      { source: "/category/deep-dive", destination: "/category/dev-knowledge", permanent: true },
    ];
  },
};

export default nextConfig;
