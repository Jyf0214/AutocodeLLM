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

import { getCachedTextInputUnitRate, getWriteCacheInputUnitRate } from '@lobechat/utils';
import { ModelIcon } from '@lobehub/icons';
import { Flexbox, Icon, Segmented, Tooltip } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { ArrowDownToDot, ArrowUpFromDot, BookUp2Icon, CircleFadingArrowUp } from 'lucide-react';
import { type LobeDefaultAiModelListItem } from 'model-bank';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import { getPrice } from './pricing';

export const styles = createStaticStyles(({ css, cssVar }) => {
  return {
    container: css`
      font-size: 12px;
    `,
    desc: css`
      line-height: 12px;
      color: ${cssVar.colorTextDescription};
    `,
    pricing: css`
      font-size: 12px;
      color: ${cssVar.colorTextSecondary};
    `,
  };
});

interface ModelCardProps extends LobeDefaultAiModelListItem {
  provider: string;
}

const ModelCard = memo<ModelCardProps>(({ pricing, id, provider, displayName }) => {
  const { t } = useTranslation('chat');

  const isShowCredit = useGlobalStore(systemStatusSelectors.isShowCredit) && !!pricing;
  const updateSystemStatus = useGlobalStore((s) => s.updateSystemStatus);

  const formatPrice = getPrice(pricing || { units: [] });

  return (
    <Flexbox gap={8}>
      <Flexbox
        horizontal
        align={'center'}
        className={styles.container}
        flex={1}
        gap={40}
        justify={'space-between'}
      >
        <Flexbox horizontal align={'center'} gap={8}>
          <ModelIcon model={id} size={22} />
          <Flexbox flex={1} gap={2} style={{ minWidth: 0 }}>
            <Flexbox horizontal align={'center'} gap={8} style={{ lineHeight: '12px' }}>
              {displayName || id}
            </Flexbox>
            <span className={styles.desc}>{provider}</span>
          </Flexbox>
        </Flexbox>
        {!!pricing && (
          <Flexbox>
            <Segmented
              size={'small'}
              value={isShowCredit ? 'credit' : 'token'}
              options={[
                { label: 'Token', value: 'token' },
                {
                  label: (
                    <Tooltip title={t('messages.modelCard.creditTooltip')}>
                      <span>{t('messages.modelCard.credit')}</span>
                    </Tooltip>
                  ),
                  value: 'credit',
                },
              ]}
              onChange={(value) => {
                updateSystemStatus({ isShowCredit: value === 'credit' });
              }}
            />
          </Flexbox>
        )}
      </Flexbox>
      {isShowCredit ? (
        <Flexbox horizontal justify={'space-between'}>
          <div />
          <Flexbox horizontal align={'center'} className={styles.pricing} gap={8}>
            {t('messages.modelCard.creditPricing')}:
            {getCachedTextInputUnitRate(pricing) && (
              <Tooltip
                title={t('messages.modelCard.pricing.inputCachedTokens', {
                  amount: formatPrice.cachedInput,
                })}
              >
                <Flexbox horizontal gap={2}>
                  <Icon icon={CircleFadingArrowUp} />
                  {formatPrice.cachedInput}
                </Flexbox>
              </Tooltip>
            )}
            {getWriteCacheInputUnitRate(pricing) && (
              <Tooltip
                title={t('messages.modelCard.pricing.writeCacheInputTokens', {
                  amount: formatPrice.writeCacheInput,
                })}
              >
                <Flexbox horizontal gap={2}>
                  <Icon icon={BookUp2Icon} />
                  {formatPrice.writeCacheInput}
                </Flexbox>
              </Tooltip>
            )}
            <Tooltip
              title={t('messages.modelCard.pricing.inputTokens', { amount: formatPrice.input })}
            >
              <Flexbox horizontal gap={2}>
                <Icon icon={ArrowUpFromDot} />
                {formatPrice.input}
              </Flexbox>
            </Tooltip>
            <Tooltip
              title={t('messages.modelCard.pricing.outputTokens', { amount: formatPrice.output })}
            >
              <Flexbox horizontal gap={2}>
                <Icon icon={ArrowDownToDot} />
                {formatPrice.output}
              </Flexbox>
            </Tooltip>
          </Flexbox>
        </Flexbox>
      ) : (
        <div style={{ height: 18 }} />
      )}
    </Flexbox>
  );
});

export default ModelCard;
