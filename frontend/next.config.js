/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用React严格模式
  reactStrictMode: true,

  // 启用SWC压缩
  swcMinify: true,

  // 强制转译所有相关包
  transpilePackages: [
    'antd',
    '@ant-design/icons',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-tree',
    'rc-table',
    'rc-notification',
    'rc-tooltip',
    'rc-menu',
    'rc-motion'
  ],

  // 实验性功能
  experimental: {
    esmExternals: 'loose'
  },

  // 模块解析配置
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'react', 'react-dom'];
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },

  // 图片优化配置
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // API路由配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },



  // 编译配置
  compiler: {
    // 移除console.log（仅在生产环境）
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 输出配置
  output: 'standalone',

  // TypeScript配置
  typescript: {
    // 在构建时忽略TypeScript错误
    ignoreBuildErrors: false,
  },

  // ESLint配置
  eslint: {
    // 在构建时忽略ESLint错误
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;