'use client';

import { useCallback, useState } from 'react';
import { Button, Tooltip, TextArea, ActionIcon } from '@lobehub/ui';
import {
  SendOutlined,
  StopOutlined,
  GlobalOutlined,
  PaperClipOutlined,
  PictureOutlined,
  SettingOutlined,
} from '@ant-design/icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export default function ChatInput({
  onSend,
  onStop,
  placeholder = '从任何想法开始...',
  disabled = false,
  loading = false,
  className,
}: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || loading) return;
    onSend(trimmed);
    setValue('');
  }, [value, disabled, loading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        const currentValue = value;
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        setValue(currentValue.substring(0, start) + '\n' + currentValue.substring(end));
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1;
        }, 0);
      } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, value],
  );

  const canSend = value.trim().length > 0 && !disabled && !loading;

  return (
    <div className={className}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
        <Tooltip title="联网搜索">
          <ActionIcon icon={GlobalOutlined} size={{ blockSize: 20 }} />
        </Tooltip>
        <Tooltip title="上传文件">
          <ActionIcon icon={PaperClipOutlined} size={{ blockSize: 20 }} />
        </Tooltip>
        <Tooltip title="添加图片">
          <ActionIcon icon={PictureOutlined} size={{ blockSize: 20 }} />
        </Tooltip>
        <Tooltip title="设置参数">
          <ActionIcon icon={SettingOutlined} size={{ blockSize: 20 }} />
        </Tooltip>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <TextArea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            resize={false}
            style={{ minHeight: 44, maxHeight: 200 }}
          />
        </div>
        {loading ? (
          <Tooltip title="停止生成">
            <Button type="primary" danger onClick={() => { onStop?.(); }} size="large">
              <StopOutlined />
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="发送">
            <Button
              type="primary"
              onClick={handleSubmit}
              disabled={!canSend}
              size="large"
              style={{ minWidth: 48 }}
            >
              <SendOutlined />
            </Button>
          </Tooltip>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          按 Ctrl+Enter 换行
        </span>
      </div>
    </div>
  );
}
