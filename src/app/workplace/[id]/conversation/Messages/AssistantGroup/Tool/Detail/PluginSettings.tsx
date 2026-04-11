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

import { type ChatPluginPayload } from '@lobechat/types';
import { Avatar, Button, Center, Flexbox } from '@lobehub/ui';
import { Divider } from 'antd';
import { cssVar } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import PluginSettingsConfig from '@/features/PluginSettings';
import { pluginHelpers, useToolStore } from '@/store/tool';
import { pluginSelectors } from '@/store/tool/selectors';

import { ErrorActionContainer, styles as errorStyles } from '../../../../Error/style';
import { useConversationStore } from '../../../../store';

interface PluginSettingsProps {
  id: string;
  plugin?: ChatPluginPayload;
}

const PluginSettings = memo<PluginSettingsProps>(({ id, plugin }) => {
  const { t } = useTranslation('error');
  const [resend, deleteMessage] = useConversationStore((s) => [
    s.delAndRegenerateMessage,
    s.deleteMessage,
  ]);
  const pluginIdentifier = plugin?.identifier as string;
  const pluginMeta = useToolStore(pluginSelectors.getPluginMetaById(pluginIdentifier), isEqual);
  const manifest = useToolStore(pluginSelectors.getToolManifestById(pluginIdentifier), isEqual);

  return (
    !!manifest && (
      <ErrorActionContainer>
        <Center gap={16} style={{ maxWidth: 400 }}>
          <Avatar
            avatar={pluginHelpers.getPluginAvatar(pluginMeta) || '⚙️'}
            background={cssVar.colorFillContent}
            gap={12}
            shape={'square'}
            size={80}
          />
          <Flexbox style={{ fontSize: 20 }}>
            {t('pluginSettings.title', { name: pluginHelpers.getPluginTitle(pluginMeta) })}
          </Flexbox>
          <Flexbox className={errorStyles.desc}>{t('pluginSettings.desc')}</Flexbox>
          <Divider style={{ margin: '0 16px' }} />
          {manifest.settings && (
            <PluginSettingsConfig id={manifest.identifier} schema={manifest.settings} />
          )}
          <Button
            block
            style={{ marginTop: 8 }}
            type={'primary'}
            onClick={() => {
              resend(id);
              deleteMessage(id);
            }}
          >
            {t('unlock.confirm')}
          </Button>
        </Center>
      </ErrorActionContainer>
    )
  );
});

export default PluginSettings;
