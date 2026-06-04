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
  allowedDevOrigins: ['192.168.0.100','172.25.171.246','192.168.0.109'],
};

export default nextConfig;
