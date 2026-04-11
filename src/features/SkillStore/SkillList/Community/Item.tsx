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
  Block,
  DropdownMenu,
  Flexbox,
  Icon,
  Modal,
  stopPropagation,
} from '@lobehub/ui';
import { App, Button } from 'antd';
import isEqual from 'fast-deep-equal';
import { MoreVerticalIcon, Plus, Trash2 } from 'lucide-react';
import React, { memo, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MCPTag from '@/components/Plugins/MCPTag';
import PluginAvatar from '@/components/Plugins/PluginAvatar';
import McpDetail from '@/features/MCP/MCPDetail';
import McpDetailLoading from '@/features/MCP/MCPDetail/Loading';
import MCPInstallProgress from '@/features/MCP/MCPInstallProgress';
import { useMarketAuth } from '@/layout/AuthProvider/MarketAuth';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useToolStore } from '@/store/tool';
import { mcpStoreSelectors, pluginSelectors } from '@/store/tool/selectors';
import { type DiscoverMcpItem } from '@/types/discover';

import { itemStyles } from '../style';

const Item = memo<DiscoverMcpItem>(({ name, description, icon, identifier }) => {
  const styles = itemStyles;
  const { t } = useTranslation('plugin');
  const { modal } = App.useApp();
  const [detailOpen, setDetailOpen] = useState(false);

  const [installed, installing, installMCPPlugin, cancelInstallMCPPlugin, unInstallPlugin, plugin] =
    useToolStore((s) => [
      pluginSelectors.isPluginInstalled(identifier)(s),
      mcpStoreSelectors.isMCPInstalling(identifier)(s),
      s.installMCPPlugin,
      s.cancelInstallMCPPlugin,
      s.uninstallMCPPlugin,
      mcpStoreSelectors.getPluginById(identifier)(s),
    ]);

  const installProgress = useToolStore(
    mcpStoreSelectors.getMCPInstallProgress(identifier),
    isEqual,
  );

  const [togglePlugin, isPluginEnabledInAgent] = useAgentStore((s) => [
    s.togglePlugin,
    agentSelectors.currentAgentPlugins(s).includes(identifier),
  ]);
  const { isAuthenticated, signIn } = useMarketAuth();

  const isCloudMcp = !!((plugin as any)?.cloudEndPoint || (plugin as any)?.haveCloudEndpoint);

  const handleInstall = async () => {
    if (isCloudMcp && !isAuthenticated) {
      try {
        await signIn();
      } catch {
        return;
      }
    }

    const isSuccess = await installMCPPlugin(identifier);

    if (isSuccess) {
      await togglePlugin(identifier);
    }
  };

  const handleCancel = async () => {
    await cancelInstallMCPPlugin(identifier);
  };

  const renderAction = () => {
    if (installed) {
      return (
        <DropdownMenu
          nativeButton={false}
          placement="bottomRight"
          items={[
            {
              danger: true,
              icon: <Icon icon={Trash2} />,
              key: 'uninstall',
              label: t('store.actions.uninstall'),
              onClick: () => {
                modal.confirm({
                  centered: true,
                  okButtonProps: { danger: true },
                  onOk: async () => {
                    if (isPluginEnabledInAgent) {
                      await togglePlugin(identifier, false);
                    }
                    await unInstallPlugin(identifier);
                  },
                  title: t('store.actions.confirmUninstall'),
                  type: 'error',
                });
              },
            },
          ]}
        >
          <ActionIcon icon={MoreVerticalIcon} />
        </DropdownMenu>
      );
    }

    if (installing) {
      return (
        <Button size="small" variant={'filled'} onClick={handleCancel}>
          {t('store.actions.cancel')}
        </Button>
      );
    }

    return <ActionIcon icon={Plus} title={t('store.actions.install')} onClick={handleInstall} />;
  };

  return (
    <>
      <Flexbox className={styles.container} gap={0}>
        <Block
          clickable
          horizontal
          align={'center'}
          gap={12}
          paddingBlock={12}
          paddingInline={12}
          style={{ cursor: 'pointer' }}
          variant={'outlined'}
          onClick={() => setDetailOpen(true)}
        >
          <PluginAvatar avatar={icon} size={40} />
          <Flexbox flex={1} gap={4} style={{ minWidth: 0, overflow: 'hidden' }}>
            <Flexbox horizontal align="center" gap={8}>
              <span className={styles.title}>{name}</span>
              <MCPTag showText={false} />
            </Flexbox>
            {description && <span className={styles.description}>{description}</span>}
          </Flexbox>
          <div onClick={stopPropagation}>{renderAction()}</div>
        </Block>

        {!!installProgress && (
          <Flexbox paddingInline={12}>
            <MCPInstallProgress identifier={identifier} />
          </Flexbox>
        )}
      </Flexbox>
      <Modal
        destroyOnHidden
        footer={null}
        open={detailOpen}
        title={t('dev.title.skillDetails')}
        width={800}
        onCancel={() => setDetailOpen(false)}
      >
        <Suspense fallback={<McpDetailLoading />}>
          <McpDetail noSettings identifier={identifier} />
        </Suspense>
      </Modal>
    </>
  );
});

Item.displayName = 'CommunityListItem';

export default Item;
