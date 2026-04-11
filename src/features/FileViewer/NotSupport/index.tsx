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

import { Button, Center, Flexbox, FluentEmoji } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { type ComponentType, type CSSProperties } from 'react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { MORE_FILE_PREVIEW_REQUEST_URL } from '@/const/url';
import { downloadFile } from '@/utils/client/downloadFile';

const styles = createStaticStyles(({ css, cssVar }) => ({
  page: css`
    width: 100%;
    margin: 12px;
    padding: 24px;
    border-radius: 4px;

    background: ${cssVar.colorBgContainer};
    box-shadow: ${cssVar.boxShadowTertiary};
  `,
}));

interface NotSupportProps {
  fileName?: string;
  style?: CSSProperties;
  url?: string | null;
}

const NotSupport: ComponentType<NotSupportProps> = ({ fileName, url, style }) => {
  const { t } = useTranslation('file');
  const [loading, setLoading] = useState(false);

  return (
    <Flexbox className={styles.page} id="not-support-renderer" style={style}>
      <Center height={'100%'}>
        <Flexbox align={'center'} gap={12}>
          <FluentEmoji emoji={'👀'} size={64} />
          <Flexbox style={{ textAlign: 'center' }}>
            <Trans i18nKey="preview.unsupportedFileAndContact" ns={'file'}>
              此文件格式暂不支持在线预览，如有预览诉求，欢迎
              <a
                aria-label={'todo'}
                href={MORE_FILE_PREVIEW_REQUEST_URL}
                rel="noreferrer"
                target="_blank"
              >
                反馈给我们
              </a>
            </Trans>
          </Flexbox>
          {url && (
            <Button
              loading={loading}
              onClick={async () => {
                setLoading(true);
                await downloadFile(url, fileName || 'download');
                setLoading(false);
              }}
            >
              {t('preview.downloadFile')}
            </Button>
          )}
        </Flexbox>
      </Center>
    </Flexbox>
  );
};

export default NotSupport;
