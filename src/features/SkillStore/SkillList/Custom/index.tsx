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

import isEqual from 'fast-deep-equal';
import { memo, useMemo } from 'react';

import { useToolStore } from '@/store/tool';
import { agentSkillsSelectors, pluginSelectors } from '@/store/tool/selectors';

import AgentSkillItem from '../AgentSkillItem';
import Empty from '../Empty';
import { gridStyles } from '../style';
import Item from './Item';

export const CustomList = memo(() => {
  const customPlugins = useToolStore(pluginSelectors.installedCustomPluginMetaList, isEqual);
  const agentSkills = useToolStore(agentSkillsSelectors.getUserAgentSkills, isEqual);
  const searchKeywords = useToolStore((s) => s.customPluginSearchKeywords || '');
  const useFetchAgentSkills = useToolStore((s) => s.useFetchAgentSkills);
  useFetchAgentSkills(true);

  const filteredPlugins = useMemo(() => {
    const lowerKeywords = searchKeywords.toLowerCase().trim();
    if (!lowerKeywords) return customPlugins;

    return customPlugins.filter((plugin) => {
      const title = plugin.title?.toLowerCase() || '';
      const identifier = plugin.identifier?.toLowerCase() || '';
      return title.includes(lowerKeywords) || identifier.includes(lowerKeywords);
    });
  }, [customPlugins, searchKeywords]);

  const filteredAgentSkills = useMemo(() => {
    const lowerKeywords = searchKeywords.toLowerCase().trim();
    if (!lowerKeywords) return agentSkills;

    return agentSkills.filter((skill) => {
      const name = skill.name?.toLowerCase() || '';
      const identifier = skill.identifier?.toLowerCase() || '';
      return name.includes(lowerKeywords) || identifier.includes(lowerKeywords);
    });
  }, [agentSkills, searchKeywords]);

  const hasSearchKeywords = Boolean(searchKeywords && searchKeywords.trim());

  if (filteredAgentSkills.length === 0 && filteredPlugins.length === 0) {
    return <Empty search={hasSearchKeywords} />;
  }

  return (
    <div className={gridStyles.grid}>
      {filteredAgentSkills.map((skill) => (
        <AgentSkillItem key={skill.id} skill={skill} />
      ))}
      {filteredPlugins.map((plugin) => (
        <Item
          avatar={plugin.avatar}
          description={plugin.description}
          identifier={plugin.identifier}
          key={plugin.identifier}
          title={plugin.title}
        />
      ))}
    </div>
  );
});

CustomList.displayName = 'CustomList';

export default CustomList;
