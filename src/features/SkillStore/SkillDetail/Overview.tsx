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

import { Flexbox, Icon, Text, Typography } from '@lobehub/ui';
import { ExternalLink } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useDetailContext } from './DetailContext';
import { styles } from './styles';

const Overview = memo(() => {
  const { t } = useTranslation(['plugin']);
  const { author, authorUrl, localizedReadme } = useDetailContext();

  const handleAuthorClick = () => {
    if (authorUrl) {
      window.open(authorUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Flexbox gap={20}>
      {/* Introduction */}
      <Typography className={styles.introduction}>{localizedReadme}</Typography>

      {/* Developed by */}
      <Flexbox gap={8}>
        <Flexbox horizontal align="center" gap={4}>
          <span className={styles.sectionTitle}>{t('skillDetail.developedBy')}</span>
          <span
            className={styles.authorLink}
            style={{ cursor: authorUrl ? 'pointer' : 'default' }}
            onClick={handleAuthorClick}
          >
            {author}
            {authorUrl && <Icon icon={ExternalLink} size={12} />}
          </span>
        </Flexbox>
        <Text className={styles.trustWarning} type="secondary">
          {t('skillDetail.trustWarning')}
        </Text>
      </Flexbox>

      {/* Details */}
      <Flexbox gap={12}>
        <span className={styles.sectionTitle}>{t('skillDetail.details')}</span>
        <Flexbox horizontal gap={16}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{t('skillDetail.author')}</span>
            <span
              className={styles.authorLink}
              style={{ cursor: authorUrl ? 'pointer' : 'default' }}
              onClick={handleAuthorClick}
            >
              {author}
              {authorUrl && <Icon icon={ExternalLink} size={12} />}
            </span>
          </div>
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
});

export default Overview;
