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
import { css, cx } from 'antd-style';
import { memo } from 'react';

const container = css`
  position: relative;
  overflow: hidden;
  border-radius: 4px;
`;

const content = css`
  position: absolute;
  inset-block: -1px;
  inset-inline-start: -1px;

  width: calc(100% + 2px);
  height: calc(100% + 2px);
  border: 0;
`;

interface MSDocViewerProps {
  fileId: string;
  url: string | null;
}

const MSDocViewer = memo<MSDocViewerProps>(({ url }) => {
  if (!url) return null;

  return (
    <Flexbox className={cx(container)} height={'100%'} id="msdoc-renderer" width={'100%'}>
      <iframe
        className={cx(content)}
        id="msdoc-iframe"
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
        title="msdoc-iframe"
      />
    </Flexbox>
  );
});

export default MSDocViewer;
