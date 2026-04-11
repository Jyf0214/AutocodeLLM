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

import { memo, useMemo } from 'react';
import { Md5 } from 'ts-md5';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useGlobalStore } from '@/store/global';
import { globalGeneralSelectors } from '@/store/global/selectors';

import FilePlayer from './FilePlayer';
import { type TTSProps } from './InitPlayer';
import InitPlayer from './InitPlayer';

const TTS = memo<TTSProps>(
  (props) => {
    const { file, voice, content, contentMd5 } = props;
    const lang = useGlobalStore(globalGeneralSelectors.currentLanguage);
    const currentVoice = useAgentStore(agentSelectors.currentAgentTTSVoice(lang));

    const md5 = useMemo(() => Md5.hashStr(content).toString(), [content]);

    const isContentEqual = contentMd5 === md5;
    const isVoiceEqual = currentVoice === voice;
    const isEqual = isVoiceEqual && isContentEqual;

    const PlayerRender = file && isEqual ? FilePlayer : InitPlayer;

    return <PlayerRender {...props} contentMd5={md5} />;
  },
  (prevProps, nextProps) => {
    return prevProps.id === nextProps.id && prevProps.content === nextProps.content;
  },
);
export default TTS;
