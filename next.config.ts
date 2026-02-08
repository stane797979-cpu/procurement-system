import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 스트릭트 모드: 개발 환경에서 추가 검사
  reactStrictMode: true,

  // 이미지 최적화
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: false,
    // 외부 이미지 도메인 허용 (필요시 추가)
    remotePatterns: [],
  },

  // 온디맨드 엔트리 설정: 개발 시 성능 개선
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // 컴파일러 최적화
  compiler: {
    // 프로덕션에서 console 제거
    removeConsole: process.env.NODE_ENV === "production",
  },

  // 빌드 중 ESLint 에러 무시하지 않음 (strict)
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Sentry 소스맵 업로드 설정
  // (production 배포 시 자동으로 활성화)
  productionBrowserSourceMaps: true,

  // TypeScript 빌드 실패 시 배포 실패 (strict)
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },

  // 실험적 기능 최적화
  experimental: {
    // PPR (Partial Prerendering) — Next.js 15 실험적 기능
    // ppr: false, // 안정화 시 true로 변경

    // 서버 액션 최적화
    serverActions: {
      bodySizeLimit: "2mb", // 기본 1mb에서 증가
    },

    // 개발 시 메모리 최적화
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
    ],
  },

  // 웹팩 설정
  webpack: (config) => {
    return config;
  },

  // 헤더 최적화 (보안 + 캐싱)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
