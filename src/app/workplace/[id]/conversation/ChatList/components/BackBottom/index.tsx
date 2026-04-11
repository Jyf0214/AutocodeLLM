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

import { ActionIcon } from '@lobehub/ui';
import { cx } from 'antd-style';
import { ArrowDownIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { AT_BOTTOM_THRESHOLD } from '../AutoScroll/const';
import { OPEN_DEV_INSPECTOR } from '../AutoScroll/DebugInspector';
import { styles } from './style';

export interface BackBottomProps {
  atBottom: boolean;
  onScrollToBottom: () => void;
  visible: boolean;
}

const BackBottom = memo<BackBottomProps>(({ visible, atBottom, onScrollToBottom }) => {
  const { t } = useTranslation('chat');

  return (
    <>
      {/* Debug: bottom indicator line */}
      {OPEN_DEV_INSPECTOR && (
        <div
          style={{
            bottom: 0,
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
          }}
        >
          {/* Threshold area top boundary line */}
          <div
            style={{
              background: atBottom ? '#22c55e' : '#ef4444',
              height: 2,
              left: 0,
              opacity: 0.5,
              position: 'absolute',
              right: 0,
              top: -AT_BOTTOM_THRESHOLD,
            }}
          />

          {/* Threshold area mask - displayed above the indicator line */}
          <div
            style={{
              background: atBottom
                ? 'linear-gradient(to top, rgba(34, 197, 94, 0.15), transparent)'
                : 'linear-gradient(to top, rgba(239, 68, 68, 0.1), transparent)',
              height: AT_BOTTOM_THRESHOLD,
              left: 0,
              position: 'absolute',
              right: 0,
              top: -AT_BOTTOM_THRESHOLD,
            }}
          />

          {/* AutoScroll position indicator line (bottom) */}
          <div
            style={{
              background: atBottom ? '#22c55e' : '#ef4444',
              height: 2,
              width: '100%',
            }}
          />
        </div>
      )}

      <ActionIcon
        glass
        className={cx(styles.container, visible && styles.visible)}
        icon={ArrowDownIcon}
        title={t('backToBottom')}
        variant={'outlined'}
        size={{
          blockSize: 36,
          borderRadius: 36,
          size: 18,
        }}
        onClick={onScrollToBottom}
      />
    </>
  );
});

export default BackBottom;
