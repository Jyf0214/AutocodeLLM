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

import { type MarkdownProps } from '@lobehub/ui';
import { useMemo } from 'react';

import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import { type MarkdownElement } from '../../Markdown/plugins';
import { markdownElements } from '../../Markdown/plugins';
import { messageStateSelectors, useConversationStore } from '../../store';

const rehypePlugins = markdownElements
  .map((element: MarkdownElement) => element.rehypePlugin)
  .filter(Boolean);
const remarkPlugins = markdownElements
  .map((element: MarkdownElement) => element.remarkPlugin)
  .filter(Boolean);

export const useMarkdown = (id: string): Partial<MarkdownProps> => {
  const { transitionMode } = useUserStore(userGeneralSettingsSelectors.config);
  const generating = useConversationStore(messageStateSelectors.isMessageGenerating(id));

  const animated = transitionMode === 'fadeIn' && generating;

  const components = useMemo(
    () =>
      Object.fromEntries(
        markdownElements.map((element: MarkdownElement) => {
          const Component = element.Component;

          return [element.tag, (props: any) => <Component {...props} id={id} />];
        }),
      ),
    [id],
  );
  return useMemo(
    () =>
      ({
        animated,
        components,
        enableCustomFootnotes: true,
        enableStream: true,
        rehypePlugins,
        remarkPlugins,
      }) satisfies Partial<MarkdownProps>,
    [animated, components],
  );
};
