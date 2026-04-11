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

import { Flexbox, Text } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import KnowledgeIcon from '@/components/KnowledgeIcon';
import { type KnowledgeItem } from '@/types/knowledgeBase';

import Actions from './Action';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    cursor: pointer;

    position: relative;

    overflow: hidden;

    padding: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};

    background: ${cssVar.colorBgContainer};

    transition: all ${cssVar.motionDurationMid};

    &:hover {
      border-color: ${cssVar.colorPrimary};
      box-shadow: ${cssVar.boxShadowTertiary};
    }
  `,
  desc: css`
    margin: 0 !important;
    font-size: 12px;
    line-height: 1.4;
    color: ${cssVar.colorTextDescription};
  `,
  title: css`
    margin: 0 !important;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  `,
}));

const MasonryItem = memo<KnowledgeItem>(({ id, fileType, name, type, description, enabled }) => {
  return (
    <div className={styles.card}>
      <Flexbox gap={12} style={{ position: 'relative' }}>
        <Flexbox horizontal align={'center'} gap={12}>
          <KnowledgeIcon
            fileType={fileType}
            name={name}
            size={{ file: 48, repo: 48 }}
            type={type}
          />
          <Flexbox flex={1} gap={6} style={{ overflow: 'hidden', position: 'relative' }}>
            <Text className={styles.title} ellipsis={{ rows: 2 }}>
              {name}
            </Text>
          </Flexbox>
        </Flexbox>
        {description && (
          <Text className={styles.desc} ellipsis={{ rows: 3 }}>
            {description}
          </Text>
        )}
        <Flexbox align={'center'} justify={'flex-end'}>
          <Actions enabled={enabled} id={id} type={type} />
        </Flexbox>
      </Flexbox>
    </div>
  );
});

MasonryItem.displayName = 'MasonryItem';

export default MasonryItem;
