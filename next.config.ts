import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/icons/{{member}}",
      skipDefaultConversion: true,
    },
    "date-fns": {
      transform: "date-fns/{{member}}",
    },
  },
};

export default nextConfig;
