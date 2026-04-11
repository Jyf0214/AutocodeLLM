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

import { Flexbox, Popover } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { memo } from 'react';

import Image from '@/libs/next/Image';

import { dataSelectors, useConversationStore } from '../../../store';
import { type MarkdownElementProps } from '../type';

const styles = createStaticStyles(({ css, cssVar }) => ({
  imageCardLink: css`
    color: inherit;
    text-decoration: none;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.75;
    }
  `,
  imageDomain: css`
    overflow: hidden;

    font-size: 0.8em;
    line-height: 1;
    color: ${cssVar.colorTextQuaternary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  imageThumb: css`
    display: block;

    width: 100%;
    height: 160px;
    border-radius: 6px;

    object-fit: cover;
  `,
  imageTitle: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    font-size: 0.95em;
    line-height: 1.4;
    color: ${cssVar.colorTextSecondary};
    text-overflow: ellipsis;
  `,
  refChip: css`
    cursor: pointer;

    display: inline-flex;
    gap: 4px;
    align-items: center;

    padding-block: 1px;
    padding-inline: 6px;
    border-radius: 4px;

    font-size: 0.8em;
    color: ${cssVar.colorTextSecondary};
    text-decoration: none;
    vertical-align: -1px;

    background: ${cssVar.colorFillSecondary};

    transition: background 0.15s;

    &:hover {
      background: ${cssVar.colorFill};
    }
  `,
  thumbWrap: css`
    overflow: hidden;
    display: inline-flex;
    flex-shrink: 0;

    width: 16px;
    height: 16px;
    border-radius: 3px;
  `,
}));

interface ImageSearchRefProperties {
  imageIndex: number;
  originalText: string;
}

const stripHtml = (html: string) => html.replaceAll(/<[^>]*>/g, '');

const Render = memo<MarkdownElementProps<ImageSearchRefProperties>>(({ node, id }) => {
  const { imageIndex, originalText } = node?.properties || {};

  const imageResults = useConversationStore(
    (s) => dataSelectors.getDbMessageById(id)(s)?.search?.imageResults,
    isEqual,
  );

  // Fallback: no image results on this message (e.g. non-image-search model)
  const image = imageResults?.[imageIndex];
  if (!image) return <span>{originalText}</span>;

  const popoverContent = (
    <Flexbox gap={4} style={{ maxWidth: 240 }}>
      {image.imageUri && (
        <a
          className={styles.imageCardLink}
          href={image.imageUri}
          rel="noopener noreferrer"
          target="_blank"
        >
          <img
            alt={image.title ? stripHtml(image.title) : ''}
            className={styles.imageThumb}
            src={image.imageUri}
          />
        </a>
      )}
      <a
        className={styles.imageCardLink}
        href={image.sourceUri || image.imageUri}
        rel="noopener noreferrer"
        target="_blank"
        title={image.title ? stripHtml(image.title) : undefined}
      >
        <Flexbox gap={2}>
          {image.title && <div className={styles.imageTitle}>{stripHtml(image.title)}</div>}
          {image.domain && (
            <Flexbox horizontal align="center" gap={4}>
              <Image
                unoptimized
                alt={image.domain}
                height={12}
                src={`https://icons.duckduckgo.com/ip3/${image.domain}.ico`}
                style={{ borderRadius: 2, flexShrink: 0 }}
                width={12}
              />
              <div className={styles.imageDomain}>{image.domain}</div>
            </Flexbox>
          )}
        </Flexbox>
      </a>
    </Flexbox>
  );

  return (
    <Popover content={popoverContent} trigger="hover">
      <a
        href={image.imageUri}
        rel="noopener noreferrer"
        style={{ color: 'inherit', textDecoration: 'none' }}
        target="_blank"
      >
        <span className={styles.refChip}>
          {image.imageUri && (
            <span className={styles.thumbWrap}>
              <img
                alt=""
                src={image.imageUri}
                style={{ height: '100%', objectFit: 'cover', width: '100%' }}
              />
            </span>
          )}
          {originalText}
        </span>
      </a>
    </Popover>
  );
});

Render.displayName = 'ImageSearchRefRender';

export default Render;
