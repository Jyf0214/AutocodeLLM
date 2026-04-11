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

import { LOADING_FLAT } from '@lobechat/const';
import { type ModelPerformance, type ModelUsage } from '@lobechat/types';
import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';
import { authSelectors } from '@/store/user/slices/auth/selectors';

import { messageStateSelectors, useConversationStore } from '../../../store';
import ExtraContainer from '../../components/Extras/ExtraContainer';
import Translate from '../../components/Extras/Translate';
import TTS from '../../components/Extras/TTS';
import Usage from '../../components/Extras/Usage';

interface AssistantMessageExtraProps {
  content: string;
  extra?: any;
  id: string;
  model?: string;
  performance?: ModelPerformance;
  provider?: string;
  tools?: any[];
  usage?: ModelUsage;
}

export const AssistantMessageExtra = memo<AssistantMessageExtraProps>(
  ({ extra, id, content, performance, usage, tools, provider, model }) => {
    const loading = useConversationStore(messageStateSelectors.isMessageGenerating(id));
    const isLogin = useUserStore(authSelectors.isLogin);
    const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);

    const showUsage = isDevMode && content !== LOADING_FLAT && !!model;
    const showTts = isLogin && !!extra?.tts;
    const showTranslate = isLogin && !!extra?.translate;

    if (!showUsage && !showTts && !showTranslate) return null;

    return (
      <Flexbox gap={8} style={{ marginTop: !!tools?.length ? 8 : 4 }}>
        {showUsage && (
          <Usage model={model!} performance={performance} provider={provider!} usage={usage} />
        )}
        {showTts && (
          <ExtraContainer>
            <TTS content={content} id={id} loading={loading} {...extra?.tts} />
          </ExtraContainer>
        )}
        {showTranslate && (
          <ExtraContainer>
            <Translate id={id} loading={loading} {...extra?.translate} />
          </ExtraContainer>
        )}
      </Flexbox>
    );
  },
);
