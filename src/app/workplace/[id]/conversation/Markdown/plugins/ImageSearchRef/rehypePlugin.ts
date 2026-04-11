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

import { SKIP, visit } from 'unist-util-visit';

export const IMAGE_SEARCH_REF_TAG = 'image-search-ref';

/** Matches filenames like image_0.png, image_12.jpg produced by Gemini image search */
const IMAGE_REF_REGEX = /\bimage_(\d+)\.(?:png|jpe?g|gif|webp)\b/gi;

/**
 * Rehype plugin that transforms plain-text Gemini image references (e.g. `image_0.png`)
 * appearing in message content into custom `<image-search-ref>` HAST elements.
 *
 * The transformation only rewrites text nodes – markdown image syntax is untouched.
 */
export const rehypeImageSearchRef = () => (tree: any) => {
  visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
    if (index === undefined || !parent) return;

    const value = String(node.value);

    // Quick check to avoid expensive processing for most nodes
    IMAGE_REF_REGEX.lastIndex = 0;
    if (!IMAGE_REF_REGEX.test(value)) return;

    IMAGE_REF_REGEX.lastIndex = 0;
    const segments: any[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = IMAGE_REF_REGEX.exec(value)) !== null) {
      // Preserve preceding text
      if (match.index > lastIndex) {
        segments.push({ type: 'text', value: value.slice(lastIndex, match.index) });
      }

      segments.push({
        children: [{ type: 'text', value: match[0] }],
        properties: {
          imageIndex: Number(match[1]),
          originalText: match[0],
        },
        tagName: IMAGE_SEARCH_REF_TAG,
        type: 'element',
      });

      lastIndex = match.index + match[0].length;
    }

    // Preserve trailing text
    if (lastIndex < value.length) {
      segments.push({ type: 'text', value: value.slice(lastIndex) });
    }

    // No actual replacements – exit early (shouldn't happen given test above)
    if (segments.length === 0) return;

    parent.children.splice(index, 1, ...segments);
    return [SKIP, index + segments.length];
  });
};
