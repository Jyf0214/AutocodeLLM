import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  serverExternalPackages: ['node-pty', 'chokidar', 'webdav', 'zlib-sync', '@discordjs/ws', '@discordjs/gateway', '@discordjs/opus', '@discordjs/rest', 'discord.js', 'erlpack', 'tweetnacl', 'tweetnacl-secretspace'],
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['surtr-twilight-autocodellm.hf.space'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
