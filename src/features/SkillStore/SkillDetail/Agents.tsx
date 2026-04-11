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

import { Center, Grid, Icon, Skeleton, Text } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import { InboxIcon, ServerCrash } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VirtuosoGrid } from 'react-virtuoso';

import { useClientDataSWR } from '@/libs/swr';
import { discoverService } from '@/services/discover';
import { type DiscoverAssistantItem } from '@/types/discover';

import AgentItem from './AgentItem';
import { useDetailContext } from './DetailContext';
import { agentListStyles as styles } from './style';
import VirtuosoLoading from './VirtuosoLoading';

const PAGE_SIZE = 12;

const Agents = memo(() => {
  const { t } = useTranslation('plugin');
  const { identifier } = useDetailContext();

  // Local state for pagination
  const [items, setItems] = useState<DiscoverAssistantItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const prevPageRef = useRef(currentPage);

  // SWR fetch data (lazy loading - only requests when component mounts)
  const { data, isLoading, error } = useClientDataSWR(
    identifier ? ['skill-agents', identifier, currentPage] : null,
    () =>
      discoverService.getAgentsByPlugin({
        page: currentPage,
        pageSize: PAGE_SIZE,
        pluginId: identifier,
      }),
  );

  // Data accumulation logic
  useEffect(() => {
    if (data) {
      if (currentPage === 1) {
        setItems(data.items);
      } else if (currentPage > prevPageRef.current) {
        setItems((prev) => [...prev, ...data.items]);
      }
      setTotalCount(data.totalCount);
      setIsInitialized(true);
      prevPageRef.current = currentPage;
    }
  }, [data, currentPage]);

  const hasMore = items.length < totalCount;

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore]);

  // Initial loading state
  if (!isInitialized && isLoading) {
    return (
      <Grid gap={12} rows={2} width={'100%'}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            active
            avatar={{ shape: 'square', size: 40 }}
            key={index}
            paragraph={{ rows: 1 }}
          />
        ))}
      </Grid>
    );
  }

  // Error state
  if (error) {
    return (
      <Center gap={12} padding={40}>
        <Icon color={cssVar.colorTextDescription} icon={ServerCrash} size={80} />
        <Text type={'secondary'}>{t('skillDetail.networkError')}</Text>
      </Center>
    );
  }

  // Empty state
  if (isInitialized && items.length === 0) {
    return (
      <Center gap={12} padding={40}>
        <Icon color={cssVar.colorTextDescription} icon={InboxIcon} size={80} />
        <Text type={'secondary'}>{t('skillDetail.noAgents')}</Text>
      </Center>
    );
  }

  // Use VirtuosoGrid for rendering
  return (
    <VirtuosoGrid
      data={items}
      endReached={loadMore}
      increaseViewportBy={typeof window !== 'undefined' ? window.innerHeight : 0}
      itemClassName={styles.item}
      itemContent={(_, item) => <AgentItem key={item.identifier} {...item} />}
      listClassName={styles.list}
      overscan={24}
      style={{ height: '50vh', width: '100%' }}
      components={{
        Footer: isLoading ? VirtuosoLoading : () => <div style={{ height: 16 }} />,
      }}
    />
  );
});

export default Agents;
