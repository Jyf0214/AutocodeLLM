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

import { treeNodeToString } from './getNodeContent';

export const createRemarkCustomTagPlugin = (tag: string) => () => {
  return (tree: any) => {
    visit(tree, 'html', (node, index, parent) => {
      if (node.value === `<${tag}>`) {
        const startIndex = index as number;
        let endIndex = startIndex + 1;
        let hasCloseTag = false;

        // Find the closing tag
        while (endIndex < parent.children.length) {
          const sibling = parent.children[endIndex];
          if (sibling.type === 'html' && sibling.value === `</${tag}>`) {
            hasCloseTag = true;
            break;
          }
          endIndex++;
        }

        // Calculate the range of nodes to delete
        const deleteCount = hasCloseTag
          ? endIndex - startIndex + 1
          : parent.children.length - startIndex;

        // Extract content nodes
        const contentNodes = parent.children.slice(
          startIndex + 1,
          hasCloseTag ? endIndex : undefined,
        );

        // Convert to Markdown string

        const content = treeNodeToString(contentNodes);

        // Create custom node
        const customNode = {
          data: {
            hChildren: [{ type: 'text', value: content }],
            hName: tag,
          },
          position: node.position,
          type: `${tag}Block`,
        };

        // Replace the original nodes
        parent.children.splice(startIndex, deleteCount, customNode);

        // Skip already-processed nodes
        return [SKIP, startIndex + 1];
      }
    });
  };
};
