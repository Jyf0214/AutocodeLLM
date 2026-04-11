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

import { memo, useCallback, useMemo, useState } from 'react';

import { type PendingIntervention } from '../store/slices/data/pendingInterventions';
import InterventionContent from './InterventionContent';
import InterventionTabBar from './InterventionTabBar';
import { useStyles } from './style';

interface InterventionBarProps {
  interventions: PendingIntervention[];
}

const InterventionBar = memo<InterventionBarProps>(({ interventions }) => {
  const { styles } = useStyles();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Derive the active index from the stored toolCallId.
  // Falls back to the first intervention when the previously active one is resolved.
  const activeIndex = useMemo(() => {
    if (activeId) {
      const idx = interventions.findIndex((i) => i.toolCallId === activeId);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [interventions, activeId]);

  const handleTabChange = useCallback(
    (index: number) => {
      setActiveId(interventions[index]?.toolCallId ?? null);
    },
    [interventions],
  );

  const activeIntervention = interventions[activeIndex];
  if (!activeIntervention) return null;

  return (
    <div className={styles.container}>
      {interventions.length > 1 && (
        <InterventionTabBar
          activeIndex={activeIndex}
          interventions={interventions}
          onTabChange={handleTabChange}
        />
      )}
      <InterventionContent intervention={activeIntervention} key={activeIntervention.toolCallId} />
    </div>
  );
});

export default InterventionBar;
