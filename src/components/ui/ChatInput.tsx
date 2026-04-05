'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import styles from './ChatInput.module.css';

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
    if (!trimmed || disabled || loading) return;
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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, []);

  const canSend = value.trim().length > 0 && !disabled && !loading;

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
        <div className={styles.actions}>
          {loading ? (
            <Tooltip title="停止生成">
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                onClick={onStop}
                className={styles.stopBtn!}
              />
            </Tooltip>
          ) : (
            <Tooltip title="发送">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                disabled={!canSend}
                className={`${styles.sendBtn!} ${!canSend ? styles.sendBtnDisabled : ''}`}
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
