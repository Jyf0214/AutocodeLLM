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
  desc: css`
    margin: 0 !important;
    font-size: 12px;
    line-height: 1;
    color: ${cssVar.colorTextDescription};
  `,
  link: css`
    overflow: hidden;
    color: ${cssVar.colorText};
  `,
  title: css`
    margin: 0 !important;
    font-size: 14px;
    line-height: 1;
  `,
}));

const PluginItem = memo<KnowledgeItem>(({ id, fileType, name, type, description, enabled }) => {
  return (
    <Flexbox
      horizontal
      align={'center'}
      gap={8}
      justify={'space-between'}
      paddingBlock={12}
      paddingInline={16}
      style={{ position: 'relative' }}
    >
      <Flexbox
        horizontal
        align={'center'}
        flex={1}
        gap={8}
        style={{ overflow: 'hidden', position: 'relative' }}
      >
        <KnowledgeIcon fileType={fileType} name={name} size={{ file: 40, repo: 40 }} type={type} />
        <Flexbox flex={1} gap={4} style={{ overflow: 'hidden', position: 'relative' }}>
          <Flexbox horizontal align={'center'} gap={8}>
            <Text ellipsis className={styles.title}>
              {name}
            </Text>
          </Flexbox>
          {description && (
            <Text ellipsis className={styles.desc}>
              {description}
            </Text>
          )}
        </Flexbox>
      </Flexbox>
      <Actions enabled={enabled} id={id} type={type} />
    </Flexbox>
  );
});

export default PluginItem;
