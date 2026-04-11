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

import { LexicalRenderer } from '@lobehub/editor/renderer';
import type { SerializedEditorState } from 'lexical';
import type { CSSProperties } from 'react';
import { memo, useMemo } from 'react';

import { ActionTagNode } from '@/features/ChatInput/InputEditor/ActionTag/ActionTagNode';
import { ReferTopicNode } from '@/features/ChatInput/InputEditor/ReferTopic/ReferTopicNode';

interface RichTextMessageProps {
  editorState: unknown;
}

const LINE_HEIGHT = 1.6;
const style: CSSProperties = { '--common-line-height': LINE_HEIGHT } as CSSProperties;
const EXTRA_NODES = [ActionTagNode, ReferTopicNode];

const RichTextMessage = memo<RichTextMessageProps>(({ editorState }) => {
  const value = useMemo(() => {
    if (!editorState || typeof editorState !== 'object') return null;
    if (Object.keys(editorState as Record<string, unknown>).length === 0) return null;
    return editorState as SerializedEditorState;
  }, [editorState]);

  if (!value) return null;

  return <LexicalRenderer extraNodes={EXTRA_NODES} style={style} value={value} variant="chat" />;
});

RichTextMessage.displayName = 'RichTextMessage';

export default RichTextMessage;
