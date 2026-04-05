'use client';

import { useCallback, useState } from 'react';
import { ActionIcon, Text, Flexbox } from '@lobehub/ui';
import { ChatInputArea, ChatInputActionBar } from '@lobehub/ui/chat';
import {
  GlobalOutlined,
  PaperClipOutlined,
  PictureOutlined,
  SettingOutlined,
} from '@ant-design/icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export default function ChatInput({
  onSend,
  placeholder = '从任何想法开始...',
  disabled = false,
  loading = false,
  className,
}: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || loading) return;
    onSend(trimmed);
    setValue('');
  }, [value, disabled, loading, onSend]);

  return (
    <div className={className}>
      <ChatInputActionBar
        leftAddons={
          <Flexbox gap={4} horizontal>
            <ActionIcon icon={GlobalOutlined} size={{ blockSize: 20 }} />
            <ActionIcon icon={PaperClipOutlined} size={{ blockSize: 20 }} />
            <ActionIcon icon={PictureOutlined} size={{ blockSize: 20 }} />
            <ActionIcon icon={SettingOutlined} size={{ blockSize: 20 }} />
          </Flexbox>
        }
      />
      <ChatInputArea.Inner
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setValue(e.target.value);
        }}
        onSend={handleSend}
        loading={loading}
        placeholder={placeholder}
        autoSize={{ minRows: 2, maxRows: 8 }}
      />
      <Flexbox justify="center" style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          按 Ctrl+Enter 换行
        </Text>
      </Flexbox>
    </div>
  );
}
