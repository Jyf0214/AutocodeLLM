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

'use client';

import { memo } from 'react';
import { createPortal } from 'react-dom';

import { messageStateSelectors, useConversationStore, virtuaListSelectors } from '../../../store';
import { AT_BOTTOM_THRESHOLD } from './const';

/**
 * Whether to enable the debug panel
 * Set to true to display scroll position debug information
 */
export const OPEN_DEV_INSPECTOR = false;

const DebugInspector = memo(() => {
  const atBottom = useConversationStore(virtuaListSelectors.atBottom);
  const isScrolling = useConversationStore(virtuaListSelectors.isScrolling);
  const isGenerating = useConversationStore(messageStateSelectors.isAIGenerating);
  const virtuaScrollMethods = useConversationStore((s) => s.virtuaScrollMethods);

  const shouldAutoScroll = atBottom && isGenerating && !isScrolling;
  const scrollOffset = virtuaScrollMethods?.getScrollOffset?.() ?? 0;
  const scrollSize = virtuaScrollMethods?.getScrollSize?.() ?? 0;
  const viewportSize = virtuaScrollMethods?.getViewportSize?.() ?? 0;
  const distanceToBottom = scrollSize - scrollOffset - viewportSize;
  // Visual calculation
  const visualHeight = 120;
  const scale = scrollSize > 0 ? visualHeight / scrollSize : 0;
  const viewportVisualHeight = Math.max(viewportSize * scale, 10);
  const scrollVisualOffset = scrollOffset * scale;
  const thresholdVisualHeight = Math.min(AT_BOTTOM_THRESHOLD * scale, visualHeight * 0.3);

  const panel = (
    <div
      style={{
        background: 'rgba(0,0,0,0.9)',
        borderRadius: 8,
        bottom: 135,
        display: 'flex',
        fontFamily: 'monospace',
        fontSize: 11,
        gap: 16,
        left: 12,
        padding: '10px 14px',
        position: 'fixed',
        zIndex: 9999,
      }}
    >
      {/* Scroll bar visualization */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ color: '#9ca3af', fontSize: 10 }}>Scroll Position</div>
        <div
          style={{
            background: '#374151',
            borderRadius: 3,
            height: visualHeight,
            position: 'relative',
            width: 24,
          }}
        >
          {/* Threshold area (bottom 200px) */}
          <div
            style={{
              background: atBottom ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              borderRadius: '0 0 3px 3px',
              bottom: 0,
              height: thresholdVisualHeight,
              left: 0,
              position: 'absolute',
              right: 0,
            }}
          />
          {/* Current viewport position */}
          <div
            style={{
              background: atBottom ? '#22c55e' : '#3b82f6',
              borderRadius: 2,
              height: viewportVisualHeight,
              left: 2,
              position: 'absolute',
              right: 2,
              top: scrollVisualOffset,
              transition: 'top 0.1s',
            }}
          />
          {/* Threshold line */}
          <div
            style={{
              background: '#f59e0b',
              bottom: thresholdVisualHeight,
              height: 1,
              left: 0,
              position: 'absolute',
              right: 0,
            }}
          />
        </div>
        <div style={{ color: '#f59e0b', fontSize: 9, textAlign: 'center' }}>
          {AT_BOTTOM_THRESHOLD}px
        </div>
      </div>

      {/* Numeric information */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ color: '#9ca3af', fontSize: 10 }}>
          scrollSize: <span style={{ color: 'white' }}>{Math.round(scrollSize)}px</span>
        </div>
        <div style={{ color: '#9ca3af', fontSize: 10 }}>
          viewport: <span style={{ color: 'white' }}>{Math.round(viewportSize)}px</span>
        </div>
        <div style={{ color: '#9ca3af', fontSize: 10 }}>
          offset: <span style={{ color: 'white' }}>{Math.round(scrollOffset)}px</span>
        </div>
        <div
          style={{
            color: atBottom ? '#22c55e' : '#ef4444',
            fontSize: 10,
            fontWeight: 'bold',
          }}
        >
          toBottom: {Math.round(distanceToBottom)}px
          {distanceToBottom <= AT_BOTTOM_THRESHOLD ? ' ≤' : ' >'} {AT_BOTTOM_THRESHOLD}
        </div>

        <div style={{ borderTop: '1px solid #374151', marginTop: 4, paddingTop: 4 }}>
          <div style={{ color: atBottom ? '#22c55e' : '#ef4444', fontSize: 10 }}>
            atBottom: {atBottom ? 'YES' : 'NO'}
          </div>
          <div style={{ color: isGenerating ? '#3b82f6' : '#6b7280', fontSize: 10 }}>
            generating: {isGenerating ? 'YES' : 'NO'}
          </div>
          <div style={{ color: isScrolling ? '#f59e0b' : '#6b7280', fontSize: 10 }}>
            scrolling: {isScrolling ? 'YES' : 'NO'}
          </div>
        </div>

        <div
          style={{
            background: shouldAutoScroll ? '#22c55e' : '#ef4444',
            borderRadius: 3,
            color: 'white',
            fontSize: 10,
            marginTop: 4,
            padding: '2px 6px',
            textAlign: 'center',
          }}
        >
          autoScroll: {shouldAutoScroll ? 'YES' : 'NO'}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(panel, document.body);
});

DebugInspector.displayName = 'DebugInspector';

export default DebugInspector;
