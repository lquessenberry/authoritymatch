/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@authoritymatch/ui', '@authoritymatch/core'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.DRUPAL_HOSTNAME || 'authoritymatch-drupal.fly.dev',
        pathname: '/**',
      },
    ],
    formats: ['image/webp'],
  },
};

export default nextConfig;
