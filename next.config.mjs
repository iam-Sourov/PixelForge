/** @type {import('next').NextConfig} */
const nextConfig = {
  // To avoid Next.js trying to aggressively bundle native modules for the server 
  // (which causes 'failed to load external module' and memory leaks in Turbopack)
  serverExternalPackages: [
    "@imgly/background-removal-node"
  ],
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
