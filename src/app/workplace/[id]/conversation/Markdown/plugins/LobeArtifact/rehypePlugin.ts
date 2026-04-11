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

import { ARTIFACT_TAG } from '@/const/plugin';

function rehypeAntArtifact() {
  return (tree: any) => {
    visit(tree, (node, index, parent) => {
      if (node.type === 'element' && node.tagName === 'p' && node.children.length > 0) {
        const firstChild = node.children[0];
        if (firstChild.type === 'raw' && firstChild.value.startsWith(`<${ARTIFACT_TAG}`)) {
          // Extract lobeArtifact attributes
          const attributes: Record<string, string> = {};
          const attributeRegex = /(\w+)="([^"]*)"/g;
          let match;
          while ((match = attributeRegex.exec(firstChild.value)) !== null) {
            attributes[match[1]] = match[2];
          }

          // Create new lobeArtifact node
          const newNode = {
            children: [
              {
                type: 'text',
                value: node.children
                  .slice(1, -1)
                  .map((child: any) => {
                    if (child.type === 'raw') {
                      return child.value;
                    } else if (child.type === 'text') {
                      return child.value;
                    } else if (child.type === 'element' && child.tagName === 'a') {
                      return child.children[0].value;
                    }
                    return '';
                  })
                  .join('')
                  .trim(),
              },
            ],
            properties: attributes,
            tagName: ARTIFACT_TAG,
            type: 'element',
          };

          // Replace the original p node
          parent.children.splice(index, 1, newNode);
          return [SKIP, index];
        }
      }
      // If the string is <lobeArtifact identifier="ai-new-interpretation" type="image/svg+xml" title="New AI Interpretation">
      // The resulting node is:
      // {
      //   type: 'raw',
      //   value:
      //     '<lobeArtifact identifier="ai-new-interpretation" type="image/svg+xml" title="New AI Interpretation">',
      // }
      else if (node.type === 'raw' && node.value.startsWith(`<${ARTIFACT_TAG}`)) {
        // Create new lobeArtifact node
        const newNode = {
          children: [],
          properties: {},
          tagName: ARTIFACT_TAG,
          type: 'element',
        };

        // Replace the original p node
        parent.children.splice(index, 1, newNode);
        return [SKIP, index];
      }
    });
  };
}

export default rehypeAntArtifact;
