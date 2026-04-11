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

import { Flexbox, Segmented } from '@lobehub/ui';
import { type SegmentedOptions } from 'antd/es/segmented';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Search from './Search';
import AddSkillButton from './SkillList/AddSkillButton';
import CustomList from './SkillList/Custom';
import LobeHubList from './SkillList/LobeHub';
import MarketSkillList from './SkillList/MarketSkills';
import MCPList from './SkillList/MCP';

export enum SkillStoreTab {
  Custom = 'custom',
  LobeHub = 'lobehub',
  MCP = 'mcp',
  Skills = 'skills',
}

export const SkillStoreContent = () => {
  const { t } = useTranslation('setting');
  const [activeTab, setActiveTab] = useState<SkillStoreTab>(SkillStoreTab.LobeHub);
  const [lobehubKeywords, setLobehubKeywords] = useState('');
  const [skillKeywords, setSkillKeywords] = useState('');

  const options: SegmentedOptions = [
    { label: t('skillStore.tabs.lobehub'), value: SkillStoreTab.LobeHub },
    { label: 'Skills', value: SkillStoreTab.Skills },
    { label: t('skillStore.tabs.mcp'), value: SkillStoreTab.MCP },
    { label: t('skillStore.tabs.custom'), value: SkillStoreTab.Custom },
  ];

  const isLobeHub = activeTab === SkillStoreTab.LobeHub;
  const isSkills = activeTab === SkillStoreTab.Skills;
  const isMCP = activeTab === SkillStoreTab.MCP;
  const isCustom = activeTab === SkillStoreTab.Custom;

  return (
    <Flexbox gap={8} style={{ maxHeight: '75vh' }} width={'100%'}>
      <Flexbox gap={8} paddingInline={16}>
        <Flexbox horizontal align={'center'} gap={8}>
          <Segmented
            block
            options={options}
            style={{ flex: 1 }}
            value={activeTab}
            variant={'filled'}
            onChange={(v) => setActiveTab(v as SkillStoreTab)}
          />
          <AddSkillButton />
        </Flexbox>
        <Search
          activeTab={activeTab}
          onLobeHubSearch={setLobehubKeywords}
          onSkillSearch={setSkillKeywords}
        />
      </Flexbox>
      <Flexbox height={496}>
        <Flexbox flex={1} style={{ display: isLobeHub ? 'flex' : 'none', overflow: 'auto' }}>
          <LobeHubList keywords={lobehubKeywords} />
        </Flexbox>
        <Flexbox flex={1} style={{ display: isSkills ? 'flex' : 'none', overflow: 'auto' }}>
          <MarketSkillList keywords={skillKeywords} />
        </Flexbox>
        <Flexbox flex={1} style={{ display: isMCP ? 'flex' : 'none', overflow: 'auto' }}>
          <MCPList />
        </Flexbox>
        <Flexbox flex={1} style={{ display: isCustom ? 'flex' : 'none', overflow: 'auto' }}>
          <CustomList />
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
};
