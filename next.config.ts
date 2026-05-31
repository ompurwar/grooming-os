import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'urwtuxmjfsiktchpwzww.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Allow access from local network IP for testing on other devices
  allowedDevOrigins: ['192.168.0.100'],
};

export default nextConfig;
