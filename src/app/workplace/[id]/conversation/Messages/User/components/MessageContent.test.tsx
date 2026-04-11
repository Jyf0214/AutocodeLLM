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

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MessageContent from './MessageContent';

vi.mock('@/features/Conversation/Markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown-message">{children}</div>,
}));

vi.mock('../useMarkdown', () => ({
  useMarkdown: () => ({}),
}));

vi.mock('./RichTextMessage', () => ({
  default: ({ editorState }: any) => (
    <div data-testid="rich-message">{JSON.stringify(editorState)}</div>
  ),
}));

vi.mock('./FileListViewer', () => ({
  default: () => null,
}));
vi.mock('./ImageFileListViewer', () => ({
  default: () => null,
}));
vi.mock('./PageSelections', () => ({
  default: () => null,
}));
vi.mock('./VideoFileListViewer', () => ({
  default: () => null,
}));

describe('User MessageContent', () => {
  it('should prefer rich text rendering when editorData exists', () => {
    render(
      <MessageContent
        content={'markdown-content'}
        createdAt={Date.now()}
        editorData={{ root: { children: [], type: 'root', version: 1 } }}
        id={'msg-1'}
        role={'user'}
        updatedAt={Date.now()}
      />,
    );

    expect(screen.getByTestId('rich-message')).toBeInTheDocument();
    expect(screen.queryByTestId('markdown-message')).not.toBeInTheDocument();
  });

  it('should render markdown when editorData is missing', () => {
    render(
      <MessageContent
        content={'markdown-content'}
        createdAt={Date.now()}
        id={'msg-2'}
        role={'user'}
        updatedAt={Date.now()}
      />,
    );

    expect(screen.getByTestId('markdown-message')).toBeInTheDocument();
    expect(screen.queryByTestId('rich-message')).not.toBeInTheDocument();
  });
});
