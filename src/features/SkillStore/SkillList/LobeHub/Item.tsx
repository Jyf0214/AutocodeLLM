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

import { ActionIcon, Block, DropdownMenu, Flexbox, Icon, stopPropagation } from '@lobehub/ui';
import { App } from 'antd';
import { cssVar } from 'antd-style';
import type { Klavis } from 'klavis';
import { Loader2, MoreVerticalIcon, Plus, Unplug } from 'lucide-react';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { itemStyles } from '../style';
import { useSkillConnect } from './useSkillConnect';

interface ItemProps {
  description?: string;
  icon: string | React.ComponentType;
  identifier: string;
  isConnected: boolean;
  label: string;
  onOpenDetail?: () => void;
  serverName?: Klavis.McpServerName;
  type: 'klavis' | 'lobehub';
}

const Item = memo<ItemProps>(
  ({ description, icon, identifier, label, onOpenDetail, serverName, type }) => {
    const { t } = useTranslation('setting');
    const styles = itemStyles;
    const { modal } = App.useApp();

    const { handleConnect, handleDisconnect, isConnected, isConnecting } = useSkillConnect({
      identifier,
      serverName,
      type,
    });

    // Get localized description
    const i18nPrefix = type === 'klavis' ? 'tools.klavis.servers' : 'tools.lobehubSkill.providers';
    // @ts-ignore
    const localizedDescription = t(`${i18nPrefix}.${identifier}.description`, {
      defaultValue: description,
    });

    const confirmDisconnect = () => {
      modal.confirm({
        cancelText: t('cancel', { ns: 'common' }),
        centered: true,
        content: t('tools.lobehubSkill.disconnectConfirm.desc', { name: label }),
        okButtonProps: { danger: true },
        okText: t('tools.lobehubSkill.disconnect'),
        onOk: handleDisconnect,
        title: t('tools.lobehubSkill.disconnectConfirm.title', { name: label }),
      });
    };

    const renderIcon = () => {
      if (typeof icon === 'string') {
        return <img alt={label} height={40} src={icon} width={40} />;
      }
      return <Icon fill={cssVar.colorText} icon={icon as any} size={40} />;
    };

    const renderAction = () => {
      if (isConnecting) {
        return <ActionIcon loading icon={Loader2} />;
      }

      if (isConnected) {
        return (
          <DropdownMenu
            nativeButton={false}
            placement="bottomRight"
            items={[
              {
                danger: true,
                icon: <Icon icon={Unplug} />,
                key: 'disconnect',
                label: t('tools.lobehubSkill.disconnect'),
                onClick: confirmDisconnect,
              },
            ]}
          >
            <ActionIcon icon={MoreVerticalIcon} />
          </DropdownMenu>
        );
      }

      return (
        <ActionIcon icon={Plus} title={t('tools.lobehubSkill.connect')} onClick={handleConnect} />
      );
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
        {renderIcon()}
        <Flexbox flex={1} gap={4} style={{ minWidth: 0, overflow: 'hidden' }}>
          <span className={styles.title}>{label}</span>
          {localizedDescription && (
            <span className={styles.description}>{localizedDescription}</span>
          )}
        </Flexbox>
        <div onClick={stopPropagation}>{renderAction()}</div>
      </Block>
    );
  },
);

Item.displayName = 'LobeHubListItem';

export default Item;
