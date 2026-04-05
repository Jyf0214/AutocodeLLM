'use client';

import { useCallback, useState } from 'react';
import { Button, Tooltip, TextArea } from '@lobehub/ui';
import { SendOutlined, StopOutlined } from '@ant-design/icons';

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
  placeholder = '输入消息...',
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
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInput = useCallback(
    (_e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // 输入事件处理，保留以备将来扩展
    },
    [],
  );

  const canSend = value.trim().length > 0 && !disabled && !loading;

  return (
    <div className={className} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        <TextArea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          resize={false}
          style={{ minHeight: 36, maxHeight: 200 }}
        />
      </div>
      {loading ? (
        <Tooltip title="停止生成">
          <Button type="primary" danger onClick={() => { onStop?.(); }}>
            <StopOutlined />
          </Button>
        </Tooltip>
      ) : (
        <Tooltip title="发送">
          <Button type="primary" onClick={handleSubmit} disabled={!canSend}>
            <SendOutlined />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
