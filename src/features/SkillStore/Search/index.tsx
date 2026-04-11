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

import { Flexbox, SearchBar } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useToolStore } from '@/store/tool';

import { SkillStoreTab } from '../SkillStoreContent';

interface SearchProps {
  activeTab: SkillStoreTab;
  onLobeHubSearch: (keywords: string) => void;
  onSkillSearch: (keywords: string) => void;
}

export const Search = memo<SearchProps>(({ activeTab, onLobeHubSearch, onSkillSearch }) => {
  const { t } = useTranslation('setting');
  const mcpKeywords = useToolStore((s) => s.mcpSearchKeywords);

  const keywords = activeTab === SkillStoreTab.MCP ? mcpKeywords : '';

  return (
    <Flexbox horizontal align={'center'} gap={8} justify={'space-between'}>
      <Flexbox flex={1}>
        <SearchBar
          allowClear
          defaultValue={keywords}
          placeholder={t('skillStore.search')}
          variant="outlined"
          onSearch={(keywords: string) => {
            if (activeTab === SkillStoreTab.MCP) {
              useToolStore.setState({ mcpSearchKeywords: keywords, searchLoading: true });
            } else if (activeTab === SkillStoreTab.Skills) {
              onSkillSearch(keywords);
            } else if (activeTab === SkillStoreTab.Custom) {
              useToolStore.setState({ customPluginSearchKeywords: keywords });
            } else {
              onLobeHubSearch(keywords);
            }
          }}
        />
      </Flexbox>
    </Flexbox>
  );
});

export default Search;
