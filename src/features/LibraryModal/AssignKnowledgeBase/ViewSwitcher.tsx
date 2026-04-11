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

import { ActionIcon, Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { Grid3x3Icon, ListIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

export type ViewMode = 'list' | 'masonry';

interface ViewSwitcherProps {
  onViewChange: (view: ViewMode) => void;
  view: ViewMode;
}

const styles = createStaticStyles(({ css }) => ({
  container: css`
    gap: 4px;
  `,
}));

const ViewSwitcher = memo<ViewSwitcherProps>(({ onViewChange, view }) => {
  const { t } = useTranslation('components');

  return (
    <Flexbox horizontal className={styles.container}>
      <ActionIcon
        active={view === 'list'}
        icon={ListIcon}
        size={16}
        title={t('FileManager.view.list')}
        onClick={() => onViewChange('list')}
      />
      <ActionIcon
        active={view === 'masonry'}
        icon={Grid3x3Icon}
        size={16}
        title={t('FileManager.view.masonry')}
        onClick={() => onViewChange('masonry')}
      />
    </Flexbox>
  );
});

export default ViewSwitcher;
