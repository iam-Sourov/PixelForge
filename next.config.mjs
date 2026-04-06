/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
    turbopack: {} // Silence turbopack warning
  },
  eslint: {
    ignoreDuringBuilds: true, // Prevents Vercel WorkerError due to memory timeouts during linting
  },
  typescript: {
    ignoreBuildErrors: true, // Prevents Vercel WorkerError due to heavy TS parsing on imgly/ag-psd
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
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
