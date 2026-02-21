import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@wellsaid/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "jmvwvsegbilscyxwzuqz.supabase.co" },
    ],
  },
};

export default nextConfig;
