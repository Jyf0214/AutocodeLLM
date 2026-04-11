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

import { Flexbox } from '@lobehub/ui';
import { Typography } from 'antd';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFeedbackModal } from '@/hooks/useFeedbackModal';

const WantMoreSkills = memo(() => {
  const { t } = useTranslation('setting');
  const { open: openFeedbackModal } = useFeedbackModal();

  const handleClick = () => {
    openFeedbackModal({
      message: t('skillStore.wantMore.feedback.message'),
      title: t('skillStore.wantMore.feedback.title'),
    });
  };

  return (
    <Flexbox align="center" justify="center" paddingBlock={24}>
      <Typography.Text type="secondary">
        {t('skillStore.wantMore.reachedEnd')}{' '}
        <Typography.Link onClick={handleClick}>{t('skillStore.wantMore.action')}</Typography.Link>
      </Typography.Text>
    </Flexbox>
  );
});

WantMoreSkills.displayName = 'WantMoreSkills';

export default WantMoreSkills;
