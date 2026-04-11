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

import { toMarkdown } from 'mdast-util-to-markdown';
import { type Parent } from 'unist';

const processNode = (node: any): string => {
  // Handle math formula nodes
  if (node.type === 'inlineMath') {
    return `$${node.value}$`;
  }

  if (node.type === 'link') {
    const text = node.children?.[0] ? processNode(node.children?.[0]) : '';

    return `[${text}](${node.url})`;
  }

  // Handle containers with child nodes
  if (node.children) {
    const content = node.children.map((element: Parent) => processNode(element)).join('');

    // Handle special line-break logic for lists
    if (node.type === 'list') {
      return `\n${content}\n`;
    }

    // Handle list item prefixes
    if (node.type === 'listItem') {
      const prefix = node.checked !== null ? `[${node.checked ? 'x' : ' '}] ` : '';
      return `${prefix}${content}`;
    }

    return content;
  }

  // Handle text nodes
  if (node.value) {
    // Preserve original whitespace handling logic
    return node.value.replaceAll(/^\s+|\s+$/g, ' ');
  }

  // Fall back to standard conversion
  return toMarkdown(node);
};

export const treeNodeToString = (nodes: Parent[]) => {
  return nodes
    .map((node) => {
      // Handle list indentation
      if (node.type === 'list') {
        return node.children
          .map((item, index) => {
            const prefix = (node as any).ordered ? `${(node as any).start + index}. ` : '- ';
            return `${prefix}${processNode(item)}`;
          })
          .join('\n');
      }

      return processNode(node);
    })
    .join('\n\n')
    .trim();
};
