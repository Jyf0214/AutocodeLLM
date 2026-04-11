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

import { Center, Empty, Flexbox, Icon } from '@lobehub/ui';
import { VirtuosoMasonry } from '@virtuoso.dev/masonry';
import { BookOpen, ServerCrash } from 'lucide-react';
import React, { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import { useAgentStore } from '@/store/agent';
import { useGlobalStore } from '@/store/global';

import Item from './Item';
import MasonryItemWrapper from './Item/MasonryItemWrapper';
import Loading from './Loading';
import MasonrySkeleton from './MasonrySkeleton';
import { type ViewMode } from './ViewSwitcher';
import ViewSwitcher from './ViewSwitcher';

export const List = memo(() => {
  const { t } = useTranslation('file');

  const [useFetchFilesAndKnowledgeBases, activeAgentId] = useAgentStore((s) => [
    s.useFetchFilesAndKnowledgeBases,
    s.activeAgentId,
  ]);

  const { isLoading, error, data } = useFetchFilesAndKnowledgeBases(activeAgentId);

  const [columnCount, setColumnCount] = useState(2);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const viewMode = useGlobalStore((s) => s.status.knowledgeBaseModalViewMode || 'list') as ViewMode;
  const updateSystemStatus = useGlobalStore((s) => s.updateSystemStatus);
  const setViewMode = (mode: ViewMode) => {
    setIsTransitioning(true);
    updateSystemStatus({ knowledgeBaseModalViewMode: mode });
  };

  // Update column count based on window size (max 2 columns for modal)
  const updateColumnCount = React.useCallback(() => {
    const width = window.innerWidth;
    if (width < 480) {
      setColumnCount(1);
    } else {
      setColumnCount(2);
    }
  }, []);

  // Initialize column count on mount
  React.useEffect(() => {
    updateColumnCount();
  }, [updateColumnCount]);

  // Set up resize listener when in masonry mode
  React.useEffect(() => {
    if (viewMode === 'masonry') {
      window.addEventListener('resize', updateColumnCount);
      return () => window.removeEventListener('resize', updateColumnCount);
    }
  }, [viewMode, updateColumnCount]);

  // Handle view transition with a brief delay to show skeleton
  React.useEffect(() => {
    if (isTransitioning && data) {
      requestAnimationFrame(() => {
        const timer = setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
        return () => clearTimeout(timer);
      });
    }
  }, [isTransitioning, viewMode, data]);

  const isEmpty = data && data.length === 0;

  const masonryContext = useMemo(() => ({}), []);

  return (
    <Flexbox height={500}>
      <Flexbox paddingInline={16} style={{ paddingBlockEnd: 12 }}>
        <Flexbox horizontal align={'center'} justify={'flex-end'}>
          <ViewSwitcher view={viewMode} onViewChange={setViewMode} />
        </Flexbox>
      </Flexbox>
      {isLoading || isTransitioning ? (
        viewMode === 'masonry' ? (
          <MasonrySkeleton columnCount={columnCount} />
        ) : (
          <Loading />
        )
      ) : isEmpty ? (
        <Center gap={12} padding={40}>
          {error ? (
            <>
              <Icon icon={ServerCrash} size={80} />
              {t('networkError')}
            </>
          ) : (
            <Empty
              description={t('empty')}
              descriptionProps={{ fontSize: 14 }}
              icon={BookOpen}
              style={{ maxWidth: 400 }}
            />
          )}
        </Center>
      ) : viewMode === 'list' ? (
        <Virtuoso
          increaseViewportBy={typeof window !== 'undefined' ? window.innerHeight : 0}
          overscan={24}
          style={{ flex: 1, marginInline: -16 }}
          totalCount={data!.length}
          itemContent={(index) => {
            const item = data![index];
            return <Item key={item.id} {...item} />;
          }}
        />
      ) : (
        <div style={{ height: '100%', position: 'relative' }}>
          <div style={{ inset: 0, position: 'absolute' }}>
            <VirtuosoMasonry
              ItemContent={MasonryItemWrapper}
              columnCount={columnCount}
              context={masonryContext}
              data={data || []}
              style={{
                gap: '16px',
                height: '100%',
              }}
            />
          </div>
        </div>
      )}
    </Flexbox>
  );
});

export default List;
