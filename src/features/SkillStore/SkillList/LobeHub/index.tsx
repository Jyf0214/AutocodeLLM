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

import { KLAVIS_SERVER_TYPES, LOBEHUB_SKILL_PROVIDERS } from '@lobechat/const';
import { type BuiltinSkill, type LobeToolMeta } from '@lobechat/types';
import isEqual from 'fast-deep-equal';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createBuiltinAgentSkillDetailModal,
  createBuiltinSkillDetailModal,
  createKlavisSkillDetailModal,
  createLobehubSkillDetailModal,
} from '@/features/SkillStore/SkillDetail';
import { serverConfigSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useToolStore } from '@/store/tool';
import { type ToolStoreState } from '@/store/tool/initialState';
import { klavisStoreSelectors, lobehubSkillStoreSelectors } from '@/store/tool/selectors';
import { KlavisServerStatus } from '@/store/tool/slices/klavisStore';
import { LobehubSkillStatus } from '@/store/tool/slices/lobehubSkillStore/types';

import BuiltinItem from '../Builtin/Item';
import Empty from '../Empty';
import { gridStyles } from '../style';
import WantMoreSkills from '../WantMoreSkills';
import Item from './Item';

interface LobeHubListProps {
  keywords: string;
}

// Selector to get only actual builtin tools (not including Klavis)
const getBuiltinToolsOnly = (s: ToolStoreState): LobeToolMeta[] => {
  return s.builtinTools
    .filter((item) => !item.hidden)
    .map((t) => ({
      author: 'LobeHub',
      identifier: t.identifier,
      meta: t.manifest.meta,
      type: 'builtin' as const,
    }));
};

export const LobeHubList = memo<LobeHubListProps>(({ keywords }) => {
  const { t } = useTranslation('setting');
  const isLobehubSkillEnabled = useServerConfigStore(serverConfigSelectors.enableLobehubSkill);
  const isKlavisEnabled = useServerConfigStore(serverConfigSelectors.enableKlavis);
  const allLobehubSkillServers = useToolStore(lobehubSkillStoreSelectors.getServers, isEqual);
  const allKlavisServers = useToolStore(klavisStoreSelectors.getServers, isEqual);
  // Use custom selector to get only actual builtin tools (not Klavis)
  const builtinTools = useToolStore(getBuiltinToolsOnly, isEqual);
  const builtinSkills = useToolStore((s) => s.builtinSkills, isEqual);

  const [useFetchLobehubSkillConnections, useFetchUserKlavisServers] = useToolStore((s) => [
    s.useFetchLobehubSkillConnections,
    s.useFetchUserKlavisServers,
  ]);

  useFetchLobehubSkillConnections(isLobehubSkillEnabled);
  useFetchUserKlavisServers(isKlavisEnabled);

  const getLobehubSkillServerByProvider = useCallback(
    (providerId: string) => {
      return allLobehubSkillServers.find((server) => server.identifier === providerId);
    },
    [allLobehubSkillServers],
  );

  const getKlavisServerByIdentifier = useCallback(
    (identifier: string) => {
      return allKlavisServers.find((server) => server.identifier === identifier);
    },
    [allKlavisServers],
  );

  const filteredItems = useMemo(() => {
    const items: Array<
      | { provider: (typeof LOBEHUB_SKILL_PROVIDERS)[number]; type: 'lobehub' }
      | { serverType: (typeof KLAVIS_SERVER_TYPES)[number]; type: 'klavis' }
      | { skill: BuiltinSkill; type: 'builtinAgentSkill' }
      | { tool: LobeToolMeta; type: 'builtin' }
    > = [];

    // Add builtin agent skills first
    for (const skill of builtinSkills) {
      items.push({ skill, type: 'builtinAgentSkill' });
    }

    // Add builtin tools
    for (const tool of builtinTools) {
      items.push({ tool, type: 'builtin' });
    }

    // Add LobeHub skills
    if (isLobehubSkillEnabled) {
      for (const provider of LOBEHUB_SKILL_PROVIDERS) {
        items.push({ provider, type: 'lobehub' });
      }
    }

    // Add Klavis skills
    if (isKlavisEnabled) {
      for (const serverType of KLAVIS_SERVER_TYPES) {
        items.push({ serverType, type: 'klavis' });
      }
    }

    // Filter by keywords
    const lowerKeywords = keywords.toLowerCase().trim();
    if (!lowerKeywords) return items;

    return items.filter((item) => {
      if (item.type === 'builtinAgentSkill') {
        const name = item.skill.name.toLowerCase();
        const identifier = item.skill.identifier.toLowerCase();
        return name.includes(lowerKeywords) || identifier.includes(lowerKeywords);
      }
      if (item.type === 'builtin') {
        const title = item.tool.meta?.title?.toLowerCase() || '';
        const identifier = item.tool.identifier?.toLowerCase() || '';
        return title.includes(lowerKeywords) || identifier.includes(lowerKeywords);
      }
      const label = item.type === 'lobehub' ? item.provider.label : item.serverType.label;
      return label.toLowerCase().includes(lowerKeywords);
    });
  }, [keywords, isLobehubSkillEnabled, isKlavisEnabled, builtinTools, builtinSkills]);

  const hasSearchKeywords = Boolean(keywords && keywords.trim());

  if (filteredItems.length === 0) return <Empty search={hasSearchKeywords} />;

  return (
    <>
      <div className={gridStyles.grid}>
        {filteredItems.map((item) => {
          if (item.type === 'builtinAgentSkill') {
            const localizedTitle = t(`tools.builtins.${item.skill.identifier}.title`, {
              defaultValue: item.skill.name,
            });
            const localizedDescription = t(`tools.builtins.${item.skill.identifier}.description`, {
              defaultValue: item.skill.description,
            });
            return (
              <BuiltinItem
                avatar={item.skill.avatar}
                description={localizedDescription}
                identifier={item.skill.identifier}
                key={item.skill.identifier}
                title={localizedTitle}
                onOpenDetail={() =>
                  createBuiltinAgentSkillDetailModal({ identifier: item.skill.identifier })
                }
              />
            );
          }
          if (item.type === 'builtin') {
            const localizedTitle = t(`tools.builtins.${item.tool.identifier}.title`, {
              defaultValue: item.tool.meta?.title || item.tool.identifier,
            });
            const localizedDescription = t(`tools.builtins.${item.tool.identifier}.description`, {
              defaultValue: item.tool.meta?.description || '',
            });
            return (
              <BuiltinItem
                avatar={item.tool.meta?.avatar}
                description={localizedDescription}
                identifier={item.tool.identifier}
                key={item.tool.identifier}
                title={localizedTitle}
                onOpenDetail={() =>
                  createBuiltinSkillDetailModal({ identifier: item.tool.identifier })
                }
              />
            );
          }
          if (item.type === 'lobehub') {
            const server = getLobehubSkillServerByProvider(item.provider.id);
            const isConnected = server?.status === LobehubSkillStatus.CONNECTED;
            return (
              <Item
                description={item.provider.description}
                icon={item.provider.icon}
                identifier={item.provider.id}
                isConnected={isConnected}
                key={item.provider.id}
                label={item.provider.label}
                type="lobehub"
                onOpenDetail={() => createLobehubSkillDetailModal({ identifier: item.provider.id })}
              />
            );
          }
          const server = getKlavisServerByIdentifier(item.serverType.identifier);
          const isConnected = server?.status === KlavisServerStatus.CONNECTED;
          return (
            <Item
              description={item.serverType.description}
              icon={item.serverType.icon}
              identifier={item.serverType.identifier}
              isConnected={isConnected}
              key={item.serverType.identifier}
              label={item.serverType.label}
              serverName={item.serverType.serverName}
              type="klavis"
              onOpenDetail={() =>
                createKlavisSkillDetailModal({
                  identifier: item.serverType.identifier,
                  serverName: item.serverType.serverName,
                })
              }
            />
          );
        })}
      </div>
      <WantMoreSkills />
    </>
  );
});

LobeHubList.displayName = 'LobeHubList';

export default LobeHubList;
