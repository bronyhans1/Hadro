const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // shared/i18n lives outside this app so web and mobile use one catalog.
    externalDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "ppbolcwxddxtchmycjpg.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default nextConfig;
