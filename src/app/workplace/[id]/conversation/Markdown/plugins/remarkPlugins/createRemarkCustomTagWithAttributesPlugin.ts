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

// Regex to parse attributes from a string
// Handles keys, keys with quoted values (double or single), and boolean keys
const attributeRegex = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

// Helper function to parse the attribute string into an object
const parseAttributes = (attributeString: string): Record<string, string | boolean> => {
  const attributes: Record<string, string | boolean> = {};
  let match;
  while ((match = attributeRegex.exec(attributeString)) !== null) {
    const [, key, valueDouble, valueSingle, valueUnquoted] = match;
    // If any value group is captured, use it, otherwise treat as boolean true
    attributes[key] = valueDouble ?? valueSingle ?? valueUnquoted ?? true;
  }
  return attributes;
};

export const createRemarkCustomTagWithAttributesPlugin = (tag: string) => () => {
  return (tree: any) => {
    visit(tree, 'html', (node, index, parent) => {
      // Match opening tags with or without attributes
      const openTagRegex = new RegExp(`^<${tag}(\\s+[^>]+)?>$`);
      const match = node.value.match(openTagRegex);

      if (match) {
        const [, attributesString] = match;
        const startIndex = index as number;
        let endIndex = startIndex + 1;
        let hasCloseTag = false;

        // Find closing tag
        while (endIndex < parent.children.length) {
          const sibling = parent.children[endIndex];
          if (sibling.type === 'html' && sibling.value === `</${tag}>`) {
            hasCloseTag = true;
            break;
          }
          endIndex++;
        }

        // Calculate deletion range
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

        // Parse attributes
        const properties = attributesString ? parseAttributes(attributesString.trim()) : {};

        // Create custom node
        const customNode = {
          data: {
            hChildren: [{ type: 'text', value: content }],
            hName: tag,
            hProperties: properties,
          },
          position: node.position,
          type: tag,
        };

        // Replace original nodes
        parent.children.splice(startIndex, deleteCount, customNode);

        // Skip processed nodes
        return [SKIP, startIndex + 1];
      }
    });
  };
};
