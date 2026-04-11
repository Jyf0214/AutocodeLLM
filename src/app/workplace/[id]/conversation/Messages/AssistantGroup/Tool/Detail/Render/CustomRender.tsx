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

import { getBuiltinRender } from '@lobechat/builtin-tools/renders';
import { type ChatPluginPayload } from '@lobechat/types';
import { safeParseJSON } from '@lobechat/utils';
import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

interface CustomRenderProps {
  content: string;
  /**
   * The real message ID (tool message ID)
   */
  messageId?: string;
  plugin?: ChatPluginPayload;
  pluginState?: any;
  /**
   * The tool call ID from the assistant message
   */
  toolCallId: string;
}

const CustomRender = memo<CustomRenderProps>(
  ({ content, messageId, plugin, pluginState, toolCallId }) => {
    const Render = getBuiltinRender(plugin?.identifier, plugin?.apiName);

    if (!Render) return null;

    return (
      <Flexbox gap={12} id={toolCallId} width={'100%'}>
        <Render
          apiName={plugin?.apiName}
          args={safeParseJSON(plugin?.arguments)}
          content={content}
          identifier={plugin?.identifier}
          messageId={messageId!}
          pluginState={pluginState}
          toolCallId={toolCallId}
        />
      </Flexbox>
    );
  },
);

CustomRender.displayName = 'GroupCustomRender';

export default CustomRender;
