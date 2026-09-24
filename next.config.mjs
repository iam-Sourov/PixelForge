import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
