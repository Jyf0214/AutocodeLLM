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

import {
  ActionIcon,
  Avatar,
  Block,
  DropdownMenu,
  Flexbox,
  Icon,
  stopPropagation,
} from '@lobehub/ui';
import { App } from 'antd';
import { MoreVerticalIcon, Plus, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useToolStore } from '@/store/tool';
import { builtinToolSelectors } from '@/store/tool/selectors';

import { itemStyles } from '../style';

interface ItemProps {
  avatar?: string;
  description?: string;
  identifier: string;
  onOpenDetail?: () => void;
  title?: string;
}

const Item = memo<ItemProps>(({ avatar, description, identifier, onOpenDetail, title }) => {
  const { t } = useTranslation(['setting', 'plugin']);
  const styles = itemStyles;
  const { modal } = App.useApp();

  const [installBuiltinTool, uninstallBuiltinTool, isInstalled] = useToolStore((s) => [
    s.installBuiltinTool,
    s.uninstallBuiltinTool,
    builtinToolSelectors.isBuiltinToolInstalled(identifier)(s),
  ]);

  const handleInstall = async () => {
    await installBuiltinTool(identifier);
  };

  const handleUninstall = () => {
    modal.confirm({
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await uninstallBuiltinTool(identifier);
      },
      title: t('store.actions.confirmUninstall', { ns: 'plugin' }),
      type: 'error',
    });
  };

  const renderAction = () => {
    if (isInstalled) {
      return (
        <DropdownMenu
          nativeButton={false}
          placement="bottomRight"
          items={[
            {
              danger: true,
              icon: <Icon icon={Trash2} />,
              key: 'uninstall',
              label: t('store.actions.uninstall', { ns: 'plugin' }),
              onClick: handleUninstall,
            },
          ]}
        >
          <ActionIcon icon={MoreVerticalIcon} />
        </DropdownMenu>
      );
    }

    return <ActionIcon icon={Plus} title={t('tools.builtins.install')} onClick={handleInstall} />;
  };

  return (
    <Block
      horizontal
      align={'center'}
      className={styles.container}
      gap={12}
      paddingBlock={12}
      paddingInline={12}
      style={{ cursor: 'pointer' }}
      variant={'outlined'}
      onClick={onOpenDetail}
    >
      <Avatar avatar={avatar} size={40} style={{ marginInlineEnd: 0 }} />
      <Flexbox flex={1} gap={4} style={{ minWidth: 0, overflow: 'hidden' }}>
        <span className={styles.title}>{title || identifier}</span>
        {description && <span className={styles.description}>{description}</span>}
      </Flexbox>
      <div onClick={stopPropagation}>{renderAction()}</div>
    </Block>
  );
});

Item.displayName = 'BuiltinListItem';

export default Item;
