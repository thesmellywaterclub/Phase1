import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "https",
        hostname: "d30u2u954xt29r.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "swc-product-images-dev.s3.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
