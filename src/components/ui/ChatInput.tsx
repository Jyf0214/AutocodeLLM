'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import '@/styles/ChatInput.css';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || loading) {
      return;
    }
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const height = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = String(height) + 'px';
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, []);

  const canSend = value.trim().length > 0 && !disabled && !loading;

  return (
    <div className={`chat-input ${className ?? ''}`}>
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
        <div className="chat-input-actions">
          {loading ? (
            <Tooltip title="停止生成">
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                onClick={() => {
                  onStop?.();
                }}
                className="chat-input-stop-btn"
              />
            </Tooltip>
          ) : (
            <Tooltip title="发送">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                disabled={!canSend}
                className={canSend ? 'chat-input-send-btn' : 'chat-input-send-btn chat-input-send-btn-disabled'}
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
