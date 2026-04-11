/**
 * 本代码来源于 LobeChat 项目（https://github.com/lobehub/lobe-chat）
 *
 * LobeChat 许可证信息：
 * LobeHub Community License（基于 Apache License 2.0）
 * Copyright (c) 2024-2026 LobeHub LLC. All rights reserved.
 * 详细信息：http://www.apache.org/licenses/LICENSE-2.0
 *
 * 修改声明：
 * 本文件已从 LobeChat 源代码进行修改以适配 AutocodeLLM 项目。
 * 修改内容包括：目录结构调整、依赖适配、API 接口兼容等。
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 *
 * 双重许可：本文件同时受上述两个许可证约束。
 * 商业使用需分别获得对应授权。
 */

'use client';

import { Center, Flexbox, Highlighter } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';

import { useTextFileLoader } from '../../hooks/useTextFileLoader';

const styles = createStaticStyles(({ css }) => ({
  page: css`
    width: 100%;
    height: 100%;
    padding-inline: 24px 4px;
  `,
}));

const getLanguage = (fileName?: string): string => {
  if (!fileName) return 'txt';

  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    // JavaScript/TypeScript
    case 'js':
    case 'mjs':
    case 'cjs': {
      return 'javascript';
    }
    case 'ts': {
      return 'typescript';
    }
    case 'tsx': {
      return 'tsx';
    }
    case 'jsx': {
      return 'jsx';
    }

    // Python
    case 'py':
    case 'pyw': {
      return 'python';
    }

    // Java/JVM Languages
    case 'java': {
      return 'java';
    }
    case 'kt':
    case 'kts': {
      return 'kotlin';
    }
    case 'scala': {
      return 'scala';
    }
    case 'groovy': {
      return 'groovy';
    }

    // C/C++
    case 'c':
    case 'h': {
      return 'c';
    }
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'hpp':
    case 'hxx': {
      return 'cpp';
    }

    // C#
    case 'cs': {
      return 'csharp';
    }

    // Go
    case 'go': {
      return 'go';
    }

    // Rust
    case 'rs': {
      return 'rust';
    }

    // Ruby
    case 'rb': {
      return 'ruby';
    }

    // PHP
    case 'php': {
      return 'php';
    }

    // Swift
    case 'swift': {
      return 'swift';
    }

    // Shell
    case 'sh':
    case 'bash':
    case 'zsh': {
      return 'bash';
    }

    // Web
    case 'html':
    case 'htm': {
      return 'html';
    }
    case 'css': {
      return 'css';
    }
    case 'scss': {
      return 'scss';
    }
    case 'sass': {
      return 'sass';
    }
    case 'less': {
      return 'less';
    }

    // Data formats
    case 'json': {
      return 'json';
    }
    case 'xml': {
      return 'xml';
    }
    case 'yaml':
    case 'yml': {
      return 'yaml';
    }
    case 'toml': {
      return 'toml';
    }

    // Markdown
    case 'md':
    case 'mdx': {
      return 'markdown';
    }

    // SQL
    case 'sql': {
      return 'sql';
    }

    // Other popular languages
    case 'lua': {
      return 'lua';
    }
    case 'r': {
      return 'r';
    }
    case 'dart': {
      return 'dart';
    }
    case 'elixir':
    case 'ex':
    case 'exs': {
      return 'elixir';
    }
    case 'erl':
    case 'hrl': {
      return 'erlang';
    }
    case 'clj':
    case 'cljs':
    case 'cljc': {
      return 'clojure';
    }
    case 'vim': {
      return 'vim';
    }
    case 'dockerfile': {
      return 'dockerfile';
    }
    case 'graphql':
    case 'gql': {
      return 'graphql';
    }

    default: {
      return 'txt';
    }
  }
};

interface CodeViewerProps {
  fileId: string;
  fileName?: string;
  url: string | null;
}

/**
 * Render any code file.
 */
const CodeViewer = memo<CodeViewerProps>(({ url, fileName }) => {
  const { fileData, loading } = useTextFileLoader(url);
  const language = getLanguage(fileName);

  return (
    <Flexbox className={styles.page}>
      {!loading && fileData ? (
        <Highlighter language={language} showLanguage={false} variant={'borderless'}>
          {fileData}
        </Highlighter>
      ) : (
        <Center height={'100%'}>
          <NeuralNetworkLoading size={36} />
        </Center>
      )}
    </Flexbox>
  );
});

export default CodeViewer;
