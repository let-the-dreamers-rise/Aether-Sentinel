/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        os: false,
        path: false,
        'cross-fetch': false,
      };
      // Alias React Native modules that MetaMask SDK imports but aren't needed in web
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/lib/empty-module.js'),
      };
    }
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Fix for @metamask/sdk cross-fetch resolution
    config.module = config.module || {};
    config.module.noParse = config.module.noParse || [];
    if (Array.isArray(config.module.noParse)) {
      config.module.noParse.push(/@metamask\/sdk/);
    }

    return config;
  },
  // Transpile MetaMask SDK packages for Next.js compatibility
  transpilePackages: ['@metamask/sdk', '@metamask/sdk-communication-layer'],
};

export default nextConfig;
