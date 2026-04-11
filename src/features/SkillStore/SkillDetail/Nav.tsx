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

import { Flexbox, Icon, Tabs } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { BookOpenIcon, BotIcon, CodeIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const styles = createStaticStyles(({ css, cssVar }) => ({
  nav: css`
    border-block-end: 1px solid ${cssVar.colorBorder};
  `,
  tabs: css`
    scrollbar-width: none;
    overflow-x: auto;
    flex: 1;
    min-width: 0;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
}));

export type TabKey = 'agents' | 'overview' | 'schema';

interface NavProps {
  activeTab?: TabKey;
  mobile?: boolean;
  setActiveTab?: (tab: TabKey) => void;
}

const Nav = memo<NavProps>(({ activeTab = 'overview', setActiveTab, mobile }) => {
  const { t } = useTranslation('plugin');

  const items = useMemo(
    () => [
      {
        icon: <Icon icon={BookOpenIcon} size={16} />,
        key: 'overview',
        label: t('skillDetail.tabs.overview'),
      },
      {
        icon: <Icon icon={CodeIcon} size={16} />,
        key: 'schema',
        label: t('skillDetail.tabs.tools'),
      },
      {
        icon: <Icon icon={BotIcon} size={16} />,
        key: 'agents',
        label: t('skillDetail.tabs.agents'),
      },
    ],
    [t],
  );

  return (
    <Flexbox className={styles.nav}>
      <Tabs
        activeKey={activeTab}
        className={styles.tabs}
        compact={mobile}
        items={items}
        onChange={(key) => setActiveTab?.(key as TabKey)}
      />
    </Flexbox>
  );
});

export default Nav;
