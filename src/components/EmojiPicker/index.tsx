'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

export interface EmojiPickerProps {
  onChange?: (emoji: string) => void;
  shape?: 'square' | 'round';
}

const EMOJI_SETS = [
  { label: '表情', items: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '🤪', '😎', '🤗', '🤔', '😐', '😏'] },
  { label: '手势', items: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤙', '💪', '🫶', '👋', '🤘', '✊', '👊', '🤛', '🤜', '☝️', '👆', '👇', '👈'] },
  { label: '符号', items: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💝', '🔥', '⭐', '🌟', '💫', '✨', '⚡', '💎', '🏆', '🎯', '🚀'] },
];

const EmojiPicker = memo<EmojiPickerProps>(({ shape = 'square', onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleSelect = useCallback(
    (emoji: string) => {
      onChange?.(emoji);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 20,
          borderRadius: shape === 'round' ? '50%' : 6,
          padding: 4,
          lineHeight: 1,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        😊
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            background: 'var(--ant-color-bg-container, #fff)',
            border: '1px solid var(--ant-color-border, #d9d9d9)',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            width: 280,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {EMOJI_SETS.map((set) => (
            <div key={set.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{set.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {set.items.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelect(emoji)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 18,
                      padding: 4,
                      borderRadius: 4,
                      lineHeight: 1,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--ant-color-bg-text-hover, #f5f5f5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

EmojiPicker.displayName = 'EmojiPicker';

export default EmojiPicker;
