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

import { useAudioPlayer } from '@lobehub/tts/react';
import { memo, useCallback } from 'react';

import { useFileStore } from '@/store/file';

import { useConversationStore } from '../../../../store';
import { type TTSProps } from './InitPlayer';
import Player from './Player';

const FilePlayer = memo<TTSProps>(({ file, id }) => {
  const useFetchTTSFile = useFileStore((s) => s.useFetchTTSFile);
  const clearTTS = useConversationStore((s) => s.clearTTS);
  const { data, isLoading: isFileLoading } = useFetchTTSFile(file || null);
  const { isLoading, ...audio } = useAudioPlayer({ src: data ? data.url : '' });

  const handleDelete = useCallback(() => {
    clearTTS(id);
  }, [id, clearTTS]);

  if (!audio || isFileLoading) return;

  return <Player audio={audio} isLoading={isLoading} onDelete={handleDelete} />;
});

export default FilePlayer;
