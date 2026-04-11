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

import { Block, Flexbox, Icon } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import { LucideArrowRight, LucideBolt } from 'lucide-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { styles } from '../styles';

interface FooterProps {
  onClose: () => void;
}

export const Footer: FC<FooterProps> = ({ onClose }) => {
  const { t } = useTranslation('components');
  const navigate = useNavigate();

  return (
    <Flexbox className={styles.footer} padding={4}>
      <Block
        clickable
        horizontal
        gap={8}
        paddingBlock={8}
        paddingInline={12}
        variant={'borderless'}
        onClick={() => {
          navigate('/settings/provider/all');
          onClose();
        }}
      >
        <Flexbox horizontal align={'center'} gap={8} style={{ flex: 1 }}>
          <Icon icon={LucideBolt} size={'small'} />
          {t('ModelSwitchPanel.manageProvider')}
        </Flexbox>
        <Icon color={cssVar.colorTextDescription} icon={LucideArrowRight} size={'small'} />
      </Block>
    </Flexbox>
  );
};
