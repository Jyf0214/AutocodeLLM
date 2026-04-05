'use client';

import '@/styles/MessageBubble.css';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  avatar?: React.ReactNode;
  className?: string;
}

export default function MessageBubble({
  content,
  role,
  timestamp,
  avatar,
  className,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`message-bubble ${isUser ? 'message-user' : 'message-assistant'} ${className ?? ''}`}
    >
      {!isUser && (
        <div className="message-avatar">
          {avatar ?? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5.5-4 7l-3 3.5L9 16c-2-1.5-4-4-4-7a7 7 0 0 1 7-7z" />
              <circle cx="12" cy="9" r="2" />
            </svg>
          )}
        </div>
      )}
      <div className="message-wrapper">
        <div className={`message-text ${isUser ? 'message-user-text' : 'message-assistant-text'}`}>
          {content}
        </div>
        {timestamp != null && (
          <span className="message-timestamp">{timestamp}</span>
        )}
      </div>
      {isUser && (
        <div className="message-avatar">
          {avatar ?? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
