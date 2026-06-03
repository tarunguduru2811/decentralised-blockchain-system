import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow testing on local network devices (like a phone)
  // @ts-expect-error - Some Next.js versions lack types for this
  allowedDevOrigins: ['192.168.29.83', 'localhost', '127.0.0.1'],
};

export default nextConfig;
