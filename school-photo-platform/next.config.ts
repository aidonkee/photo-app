import type { NextConfig } from "next";

const nextConfig = {
  // experimental: {
  //   serverActions: {
  //     bodySizeLimit: '50mb',
  //   },
  // },
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Разрешаем картинки с Supabase
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
export default nextConfig;
