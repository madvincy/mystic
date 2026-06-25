import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**', // This wildcard allows all paths
      },
       {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**', // This wildcard allows all paths
      },
      // Add other hosts here, for example:
      // {
      //   protocol: 'https',
      //   hostname: 'lh3.googleusercontent.com',
      //   port: '',
      //   pathname: '/**',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'your-supabase-project.supabase.co',
      //   port: '',
      //   pathname: '/storage/v1/object/public/**',
      // },
    ],
  },
};

export default nextConfig;