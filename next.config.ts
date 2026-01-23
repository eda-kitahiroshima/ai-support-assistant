import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Docker用のスタンドアロンビルド
};

export default nextConfig;
