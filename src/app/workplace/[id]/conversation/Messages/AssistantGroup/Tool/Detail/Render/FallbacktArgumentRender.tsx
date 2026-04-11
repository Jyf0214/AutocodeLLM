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

import { Block, Flexbox, Highlighter, Text } from '@lobehub/ui';
import { Divider } from 'antd';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Arguments from '../Arguments';

interface FallbackArgumentRenderProps {
  content: string;
  requestArgs?: string;
  toolCallId: string;
}

export const FallbackArgumentRender = memo<FallbackArgumentRenderProps>(
  ({ toolCallId, content, requestArgs }) => {
    const { t } = useTranslation('plugin');

    // Parse and display result content
    const { data, language } = useMemo(() => {
      try {
        const parsed = JSON.parse(content || '');
        // If parsed result is a string, return it directly
        if (typeof parsed === 'string') {
          return { data: parsed, language: 'plaintext' };
        }
        return { data: JSON.stringify(parsed, null, 2), language: 'json' };
      } catch {
        return { data: content || '', language: 'plaintext' };
      }
    }, [content]);

    // Default render: show arguments and result
    return (
      <Block id={toolCallId} variant={'outlined'} width={'100%'}>
        <Arguments arguments={requestArgs} />
        {content && (
          <>
            <Divider style={{ marginBlock: 0 }} />
            <Flexbox paddingBlock={'8px 0'} paddingInline={16}>
              <Text>{t('debug.response')}</Text>
            </Flexbox>
            <Highlighter
              language={language}
              variant={'filled'}
              style={{
                background: 'transparent',
                borderRadius: 0,
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              {data}
            </Highlighter>
          </>
        )}
      </Block>
    );
  },
);
