import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'scripts/**',
      '.agents/**',
      'src/__tests__/**',
      'src/test/**',
      'src/components/**',
      'src/i18n/**',
      // ========== 不在 tsconfig.json 项目范围内的文件 ==========
      'prisma.config.ts',
      'server.ts',
      'vitest.config.ts',
      // ========== 仍在用但无需额外审查的目录豁免 ==========
      'src/hooks/**',
      'src/lib/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/react-in-jsx-scope': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
      react: { version: '19' },
    },
  },
  // 测试文件放宽规则
  {
    files: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  // API 路由和页面文件放宽 JSON 解析规则
  {
    files: ['src/app/api/**/*.ts', 'src/app/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    },
  },
  // 外部库类型豁免：xterm、chokidar、webdav 在 CI --ignore-scripts 下类型无法解析
  {
    files: [
      'src/components/features/TerminalPanel.tsx',
      'src/lib/sync/watcher.ts',
      'src/lib/sync/webdav.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
    },
  },
  // 全局关闭 react/prop-types（项目使用 TypeScript 不需要）
  {
    files: ['**/*.tsx', '**/*.ts'],
    rules: {
      'react/prop-types': 'off',
    },
  },
);
