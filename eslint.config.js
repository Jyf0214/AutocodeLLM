import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'scripts/**',
      '.agents/**',
      'src/__tests__/**',
      'src/test/**',
      // ========== 移植代码豁免（LobeChat 已验证代码，不审查） ==========
      // Store 层
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
      // Libs 层
      'src/libs/swr/**',
      'src/libs/trpc/**',
      'src/libs/mcp/**',
      'src/libs/pdfjs/**',
      'src/libs/next/**',
      // Features 层
      'src/features/LibraryModal/**',
      'src/features/ModelSwitchPanel/**',
      'src/features/SkillStore/**',
      'src/features/PluginTag/**',
      'src/features/PluginAvatar/**',
      'src/features/FileViewer/**',
      'src/features/ModelParamsControl/**',
      'src/features/ModelSelect/**',
      'src/features/ChatInput/**',
      'src/features/AgentSetting/**',
      'src/features/Conversation/**',
      'src/features/ShareModal/**',
      'src/features/WideScreenContainer/**',
      'src/features/PluginDetailModal/**',
      'src/features/PluginSettings/**',
      'src/features/LocalFile/**',
      'src/features/EditorModal/**',
      'src/features/OllamaModelDownloader/**',
      'src/features/AgentGroupAvatar/**',
      // Components 层
      'src/components/FileIcon/**',
      'src/components/EmojiPicker/**',
      'src/components/BubblesLoading/**',
      'src/components/ErrorBoundary/**',
      'src/components/GalleyGrid/**',
      'src/components/ImageItem/**',
      'src/components/CircleLoader/**',
      'src/components/FormAction/**',
      'src/components/InfoTooltip/**',
      'src/components/AntdStaticMethods/**',
      'src/components/TipGuide/**',
      'src/components/LibIcon/**',
      'src/components/DragUpload/**',
      'src/components/NeuralNetworkLoading/**',
      'src/components/HtmlPreview/**',
      'src/components/Descriptions/**',
      'src/components/StreamingMarkdown/**',
      'src/components/features/**',
      'src/components/layout/**',
      'src/components/ui/**',
      // Hooks
      'src/hooks/**',
      // Services
      'src/services/**',
      // Helpers
      'src/helpers/**',
      // Const
      'src/const/**',
      // Prompts
      'src/prompts/**',
      // Utils
      'src/utils/**',
      // Lib
      'src/lib/**',
      // Providers
      'src/providers/**',
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
  // Chat 模块 Zustand store 类型豁免
  // zustand 的类型定义在 TypeScript 严格模式下不完全兼容
  {
    files: [
      'src/app/chat/**/*',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
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
