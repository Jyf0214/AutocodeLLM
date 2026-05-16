import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  serverExternalPackages: ['node-pty', 'xterm', 'xterm-addon-fit', 'chokidar', 'webdav', 'zlib-sync', '@discordjs/ws', '@discordjs/gateway', '@discordjs/opus', '@discordjs/rest', 'discord.js', 'erlpack', 'tweetnacl', 'tweetnacl-secretspace'],
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['surtr-twilight-autocodellm.hf.space'],
};

export default withNextIntl(nextConfig);
