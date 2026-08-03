import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // nfc-pcsc はネイティブモジュール（PC/SC）を含むため、バンドルせず素の require を使わせる
  serverExternalPackages: ["nfc-pcsc", "@pokusew/pcsclite"],
};

export default nextConfig;
