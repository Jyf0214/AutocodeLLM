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

import { type ChatMessageError } from '@lobechat/types';
import { type AudioPlayerProps } from '@lobehub/tts/react';
import { AudioPlayer } from '@lobehub/tts/react';
import { ActionIcon, Alert, Button, Flexbox, Highlighter } from '@lobehub/ui';
import { TrashIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface PlayerProps extends AudioPlayerProps {
  error?: ChatMessageError;
  onDelete: () => void;
  onRetry?: () => void;
}

const Player = memo<PlayerProps>(({ onRetry, error, onDelete, audio, isLoading, onInitPlay }) => {
  const { t } = useTranslation('chat');

  return (
    <Flexbox horizontal align={'center'} style={{ minWidth: 200, width: '100%' }}>
      {error ? (
        <Alert
          closable
          style={{ alignItems: 'center', width: '100%' }}
          title={error.message}
          type="error"
          action={
            <Button size={'small'} type={'primary'} onClick={onRetry}>
              {t('retry', { ns: 'common' })}
            </Button>
          }
          extra={
            error.body && (
              <Highlighter actionIconSize={'small'} language={'json'} variant={'borderless'}>
                {JSON.stringify(error.body, null, 2)}
              </Highlighter>
            )
          }
          onClose={onDelete}
        />
      ) : (
        <>
          <AudioPlayer
            allowPause={false}
            audio={audio}
            buttonSize={'small'}
            isLoading={isLoading}
            timeRender={'tag'}
            timeStyle={{ margin: 0 }}
            onInitPlay={onInitPlay}
            onLoadingStop={stop}
          />
          <ActionIcon icon={TrashIcon} size={'small'} title={t('tts.clear')} onClick={onDelete} />
        </>
      )}
    </Flexbox>
  );
});

export default Player;
