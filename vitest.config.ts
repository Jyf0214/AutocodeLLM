// Vitest 测试框架配置
// 配置 jsdom 环境、全局变量和路径别名

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // 排除移植代码测试（LobeChat 移植代码，依赖缺失模块）
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // 移植代码测试
      'src/store/global/**',
      'src/store/aiInfra/**',
      'src/store/home/**',
      'src/store/userMemory/**',
      'src/store/mention/**',
      'src/store/middleware/**',
      'src/store/agent/**',
      'src/store/agentGroup/**',
      'src/store/chat/**',
      'src/store/file/**',
      'src/store/session/**',
      'src/store/user/**',
      'src/libs/**',
      'src/features/**',
      'src/components/**',
      'src/hooks/**',
      'src/services/**',
      'src/helpers/**',
      'src/const/**',
      'src/prompts/**',
      'src/utils/**',
      'src/lib/**',
      'src/providers/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
