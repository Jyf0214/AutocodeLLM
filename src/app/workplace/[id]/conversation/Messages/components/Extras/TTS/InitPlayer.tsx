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

import { getMessageError } from '@lobechat/fetch-sse';
import { type ChatMessageError, type ChatTTS } from '@lobechat/types';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTTS } from '@/hooks/useTTS';
import { useFileStore } from '@/store/file';

import { useConversationStore } from '../../../../store';
import Player from './Player';

export interface TTSProps extends ChatTTS {
  content: string;
  id: string;
  loading?: boolean;
}

const InitPlayer = memo<TTSProps>(({ id, content, contentMd5, file }) => {
  const [isStart, setIsStart] = useState(false);
  const [error, setError] = useState<ChatMessageError>();
  const isDeletedRef = useRef(false);
  const uploadTTS = useFileStore((s) => s.uploadTTSByArrayBuffers);
  const { t } = useTranslation('chat');

  const [ttsMessage, clearTTS] = useConversationStore((s) => [s.ttsMessage, s.clearTTS]);

  const setDefaultError = useCallback(
    (err?: any) => {
      setError({ body: err, message: t('tts.responseError', { ns: 'error' }), type: 500 });
    },
    [t],
  );

  const { isGlobalLoading, audio, start, stop, response } = useTTS(content, {
    onError: (err) => {
      if (isDeletedRef.current) return;
      stop();
      setDefaultError(err);
    },
    onErrorRetry: (err) => {
      if (isDeletedRef.current) return;
      stop();
      setDefaultError(err);
    },
    onSuccess: async () => {
      if (isDeletedRef.current) return;
      if (!response || response.ok) return;
      const message = await getMessageError(response);
      if (message) {
        setError(message);
      } else {
        setDefaultError();
      }
      stop();
    },
    onUpload: async (currentVoice, arrayBuffers) => {
      if (isDeletedRef.current) return;
      const fileID = await uploadTTS(id, arrayBuffers);
      if (isDeletedRef.current) return;
      ttsMessage(id, { contentMd5, file: fileID, voice: currentVoice });
    },
  });

  const handleInitStart = useCallback(() => {
    if (isStart) return;
    start();
    setIsStart(true);
  }, [isStart, start]);

  const handleDelete = useCallback(() => {
    isDeletedRef.current = true;
    stop();
    clearTTS(id);
  }, [stop, id, clearTTS]);

  const handleRetry = useCallback(() => {
    setError(undefined);
    start();
  }, [start]);

  useEffect(() => {
    // Skip if file exists or user has deleted TTS
    if (file || isDeletedRef.current) return;
    const timer = setTimeout(() => {
      // Double check in case user deleted during the delay
      if (isDeletedRef.current) return;
      handleInitStart();
    }, 100);
    return () => clearTimeout(timer);
  }, [file, handleInitStart]);

  return (
    <Player
      audio={audio}
      error={error}
      isLoading={isGlobalLoading}
      onDelete={handleDelete}
      onInitPlay={handleInitStart}
      onRetry={handleRetry}
    />
  );
});

export default InitPlayer;
