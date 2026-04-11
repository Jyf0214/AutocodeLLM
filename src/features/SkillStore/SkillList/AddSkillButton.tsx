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

import { Button, DropdownMenu, Flexbox, Icon, Text } from '@lobehub/ui';
import { GithubIcon } from '@lobehub/ui/icons';
import { ChevronDown, FileArchive, Grid2x2Plus, Link, PenLine } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DevModal from '@/features/PluginDevModal';
import { useAgentStore } from '@/store/agent';
import { useToolStore } from '@/store/tool';

import ImportFromGithubModal from './ImportFromGithubModal';
import ImportFromUrlModal from './ImportFromUrlModal';
import UploadSkillModal from './UploadSkillModal';

const MenuLabel = ({ desc, title }: { desc: string; title: ReactNode }) => (
  <Flexbox gap={2}>
    <span>{title}</span>
    <Text style={{ fontSize: 12 }} type="secondary">
      {desc}
    </Text>
  </Flexbox>
);

const AddSkillButton = () => {
  const { t } = useTranslation('setting');
  const [showMcpModal, setMcpModal] = useState(false);
  const [showUrlModal, setUrlModal] = useState(false);
  const [showGithubModal, setGithubModal] = useState(false);
  const [showUploadModal, setUploadModal] = useState(false);

  const [installCustomPlugin, updateNewDevPlugin] = useToolStore((s) => [
    s.installCustomPlugin,
    s.updateNewCustomPlugin,
  ]);
  const togglePlugin = useAgentStore((s) => s.togglePlugin);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <DevModal
        open={showMcpModal}
        onOpenChange={setMcpModal}
        onValueChange={updateNewDevPlugin}
        onSave={async (devPlugin) => {
          await installCustomPlugin(devPlugin);
          await togglePlugin(devPlugin.identifier);
        }}
      />
      <ImportFromUrlModal open={showUrlModal} onOpenChange={setUrlModal} />
      <ImportFromGithubModal open={showGithubModal} onOpenChange={setGithubModal} />
      <UploadSkillModal open={showUploadModal} onOpenChange={setUploadModal} />
      <DropdownMenu
        nativeButton={false}
        placement="bottomRight"
        items={[
          {
            icon: <Icon icon={Link} />,
            key: 'importUrl',
            label: <MenuLabel desc={t('tab.importFromUrl.desc')} title={t('tab.importFromUrl')} />,
            onClick: () => setUrlModal(true),
          },
          {
            icon: <Icon icon={GithubIcon} />,
            key: 'importGithub',
            label: (
              <MenuLabel desc={t('tab.importFromGithub.desc')} title={t('tab.importFromGithub')} />
            ),
            onClick: () => setGithubModal(true),
          },
          {
            icon: <Icon icon={FileArchive} />,
            key: 'uploadZip',
            label: <MenuLabel desc={t('tab.uploadZip.desc')} title={t('tab.uploadZip')} />,
            onClick: () => setUploadModal(true),
          },
          { type: 'divider' as const },
          {
            icon: <Icon icon={PenLine} />,
            key: 'customMcp',
            label: <MenuLabel desc={t('tab.addCustomMcp.desc')} title={t('tab.addCustomMcp')} />,
            onClick: () => setMcpModal(true),
          },
        ]}
      >
        <Button icon={Grid2x2Plus}>
          {t('tab.addCustomSkill')}
          <Icon icon={ChevronDown} size={14} />
        </Button>
      </DropdownMenu>
    </div>
  );
};

export default AddSkillButton;
