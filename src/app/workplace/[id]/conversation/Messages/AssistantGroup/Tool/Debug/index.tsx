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

import { type ToolIntervention } from '@lobechat/types';
import { type TabsProps } from '@lobehub/ui';
import { Block, Highlighter, Icon, Tabs } from '@lobehub/ui';
import {
  BracesIcon,
  CircleAlertIcon,
  FunctionSquareIcon,
  HandIcon,
  MessageSquareCodeIcon,
  SquareArrowDownIcon,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface DebugProps {
  apiName: string;
  identifier: string;
  intervention?: ToolIntervention;
  requestArgs?: string;
  result?: { content: string | null; error?: any; state?: any };
  toolCallId: string;
  type?: string;
}

const Debug = memo<DebugProps>(
  ({ result, requestArgs, toolCallId, apiName, identifier, type, intervention }) => {
    const { t } = useTranslation('plugin');

    const params = useMemo(() => {
      try {
        return JSON.stringify(JSON.parse(requestArgs || ''), null, 2);
      } catch {
        return '';
      }
    }, [requestArgs]);

    const functionCall = useMemo(() => {
      return {
        apiName,
        arguments: requestArgs,
        id: toolCallId,
        identifier,
        type,
      };
    }, [requestArgs, toolCallId, apiName, identifier, type]);

    const isJsonResult =
      result?.content?.trim().startsWith('{') || result?.content?.trim().startsWith('[');

    const items: TabsProps['items'] = useMemo(
      () => [
        {
          children: (
            <Highlighter
              language={'json'}
              style={{ background: 'transparent', borderRadius: 0, height: '100%' }}
              variant={'filled'}
            >
              {params}
            </Highlighter>
          ),
          icon: <Icon icon={MessageSquareCodeIcon} />,
          key: 'arguments',
          label: t('debug.arguments'),
        },
        {
          children: (
            <Highlighter
              language={isJsonResult ? 'json' : 'plaintext'}
              style={{ background: 'transparent', borderRadius: 0, height: '100%' }}
              variant={'filled'}
            >
              {isJsonResult ? JSON.stringify(result?.content, null, 2) : result?.content || ''}
            </Highlighter>
          ),
          icon: <Icon icon={SquareArrowDownIcon} />,
          key: 'response',
          label: t('debug.response'),
        },
        {
          children: (
            <Highlighter
              language={'json'}
              style={{ background: 'transparent', borderRadius: 0, height: '100%' }}
              variant={'filled'}
            >
              {JSON.stringify(functionCall, null, 2)}
            </Highlighter>
          ),
          icon: <Icon icon={FunctionSquareIcon} />,
          key: 'function_call',
          label: t('debug.function_call'),
        },
        {
          children: (
            <Highlighter
              language={'json'}
              style={{ background: 'transparent', borderRadius: 0, height: '100%' }}
              variant={'filled'}
            >
              {JSON.stringify(result?.state, null, 2)}
            </Highlighter>
          ),
          icon: <Icon icon={BracesIcon} />,
          key: 'pluginState',
          label: t('debug.pluginState'),
        },
        {
          children: (
            <Highlighter
              language={'json'}
              style={{ background: 'transparent', borderRadius: 0, height: '100%' }}
              variant={'filled'}
            >
              {JSON.stringify(intervention, null, 2)}
            </Highlighter>
          ),
          icon: <Icon icon={HandIcon} />,
          key: 'intervention',
          label: t('debug.intervention'),
        },
        ...(result?.error
          ? [
              {
                children: (
                  <Highlighter
                    language={'json'}
                    style={{ background: 'transparent', borderRadius: 0, height: '100%' }}
                    variant={'filled'}
                  >
                    {JSON.stringify(result.error, null, 2)}
                  </Highlighter>
                ),
                icon: <Icon icon={CircleAlertIcon} />,
                key: 'error',
                label: t('debug.error'),
              },
            ]
          : []),
      ],
      [
        functionCall,
        isJsonResult,
        params,
        result?.content,
        result?.error,
        result?.state,
        intervention,
        t,
      ],
    );

    return (
      <Block variant={'outlined'}>
        <Tabs
          compact
          items={items}
          tabPlacement={'start'}
          styles={{
            content: {
              height: 300,
              padding: 0,
            },
          }}
        />
      </Block>
    );
  },
);

export default Debug;
