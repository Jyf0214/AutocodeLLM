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

/**
 * @vitest-environment happy-dom
 */
import { moment } from '@lobehub/editor';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import RichTextMessage from './RichTextMessage';

const mentionEditorState = {
  root: {
    children: [
      {
        children: [
          {
            label: 'Agent A',
            metadata: { id: 'agent-a', type: 'agent' },
            type: 'mention',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

afterEach(() => {
  cleanup();
});

describe('RichTextMessage', () => {
  it('should render mention nodes from editor state', async () => {
    const { container } = render(<RichTextMessage editorState={mentionEditorState} />);

    await act(async () => {
      await moment();
    });

    expect(container.querySelector('.editor_mention')?.textContent).toBe('@Agent A');
  });

  it('should render nothing for empty editor state', () => {
    const { container } = render(<RichTextMessage editorState={{}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
