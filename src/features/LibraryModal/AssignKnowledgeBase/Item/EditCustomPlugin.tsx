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
import isEqual from 'fast-deep-equal';
import { PackageSearch } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DevModal from '@/features/PluginDevModal';
import { useToolStore } from '@/store/tool';
import { pluginSelectors } from '@/store/tool/slices/plugin/selectors';

const EditCustomPlugin = memo<{ identifier: string }>(({ identifier }) => {
  const { t } = useTranslation('plugin');
  const [showModal, setModal] = useState(false);

  const [installCustomPlugin, updateNewDevPlugin, uninstallCustomPlugin] = useToolStore((s) => [
    s.installCustomPlugin,
    s.updateNewCustomPlugin,
    s.uninstallCustomPlugin,
  ]);

  const customPlugin = useToolStore(pluginSelectors.getCustomPluginById(identifier), isEqual);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <DevModal
        mode={'edit'}
        open={showModal}
        value={customPlugin}
        onOpenChange={setModal}
        onValueChange={updateNewDevPlugin}
        onDelete={() => {
          uninstallCustomPlugin(identifier);
          setModal(false);
        }}
        onSave={async (devPlugin) => {
          await installCustomPlugin(devPlugin);
          setModal(false);
        }}
      />
      <ActionIcon
        icon={PackageSearch}
        title={t('store.actions.manifest')}
        onClick={() => {
          setModal(true);
        }}
      />
    </div>
  );
});

export default EditCustomPlugin;
