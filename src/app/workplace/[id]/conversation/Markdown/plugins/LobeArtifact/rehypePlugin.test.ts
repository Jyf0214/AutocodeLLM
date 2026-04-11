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

import { describe, expect, it } from 'vitest';

import rehypePlugin from './rehypePlugin';

describe('rehypePlugin', () => {
  it('should transform <lobeArtifact> tags with attributes', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          children: [
            {
              type: 'raw',
              value: '<lobeArtifact identifier="test-id" type="image/svg+xml" title="Test Title">',
            },
            { type: 'text', value: 'Artifact content' },
            { type: 'raw', value: '</lobeArtifact>' },
          ],
        },
      ],
    };

    const expectedTree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'lobeArtifact',
          properties: {
            identifier: 'test-id',
            type: 'image/svg+xml',
            title: 'Test Title',
          },
          children: [{ type: 'text', value: 'Artifact content' }],
        },
      ],
    };

    const plugin = rehypePlugin();
    plugin(tree);

    expect(tree).toEqual(expectedTree);
  });

  it('should handle mixed content with thinking tags and plain text', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          children: [{ type: 'text', value: 'Initial plain text paragraph' }],
        },
        {
          type: 'element',
          tagName: 'p',
          children: [
            { type: 'raw', value: '<lobeThinking>' },
            { type: 'text', value: 'AI is thinking...' },
            { type: 'raw', value: '</lobeThinking>' },
          ],
        },
        {
          type: 'element',
          tagName: 'p',
          children: [
            {
              type: 'raw',
              value: '<lobeArtifact identifier="test-id" type="image/svg+xml" title="Test Title">',
            },
            { type: 'text', value: 'Artifact content' },
            { type: 'raw', value: '</lobeArtifact>' },
          ],
        },
        {
          type: 'element',
          tagName: 'p',
          children: [{ type: 'text', value: 'Final plain text paragraph' }],
        },
      ],
    };

    const expectedTree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          children: [{ type: 'text', value: 'Initial plain text paragraph' }],
        },
        {
          type: 'element',
          tagName: 'p',
          children: [
            { type: 'raw', value: '<lobeThinking>' },
            { type: 'text', value: 'AI is thinking...' },
            { type: 'raw', value: '</lobeThinking>' },
          ],
        },
        {
          type: 'element',
          tagName: 'lobeArtifact',
          properties: {
            identifier: 'test-id',
            type: 'image/svg+xml',
            title: 'Test Title',
          },
          children: [{ type: 'text', value: 'Artifact content' }],
        },
        {
          type: 'element',
          tagName: 'p',
          children: [{ type: 'text', value: 'Final plain text paragraph' }],
        },
      ],
    };

    const plugin = rehypePlugin();
    plugin(tree);

    expect(tree).toEqual(expectedTree);
  });

  it('should transform multiple <lobeArtifact> tags in the same tree', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          children: [{ type: 'text', value: 'Here are two artifacts:' }],
        },
        {
          type: 'element',
          tagName: 'p',
          children: [
            {
              type: 'raw',
              value:
                '<lobeArtifact identifier="first" type="text/markdown" title="First Artifact">',
            },
            { type: 'text', value: 'First content' },
            { type: 'raw', value: '</lobeArtifact>' },
          ],
        },
        {
          type: 'element',
          tagName: 'p',
          children: [
            {
              type: 'raw',
              value:
                '<lobeArtifact identifier="second" type="text/markdown" title="Second Artifact">',
            },
            { type: 'text', value: 'Second content' },
            { type: 'raw', value: '</lobeArtifact>' },
          ],
        },
        {
          type: 'element',
          tagName: 'p',
          children: [{ type: 'text', value: 'Done.' }],
        },
      ],
    };

    const plugin = rehypePlugin();
    plugin(tree);

    // Both artifacts should be transformed
    expect(tree.children).toHaveLength(4);
    expect(tree.children[1]).toEqual({
      type: 'element',
      tagName: 'lobeArtifact',
      properties: {
        identifier: 'first',
        type: 'text/markdown',
        title: 'First Artifact',
      },
      children: [{ type: 'text', value: 'First content' }],
    });
    expect(tree.children[2]).toEqual({
      type: 'element',
      tagName: 'lobeArtifact',
      properties: {
        identifier: 'second',
        type: 'text/markdown',
        title: 'Second Artifact',
      },
      children: [{ type: 'text', value: 'Second content' }],
    });
  });

  it('should transform multiple raw <lobeArtifact> nodes (without wrapping <p>)', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'raw',
          value: '<lobeArtifact identifier="raw-1" type="text/html" title="Raw First">',
        },
        {
          type: 'raw',
          value: '<lobeArtifact identifier="raw-2" type="text/html" title="Raw Second">',
        },
      ],
    };

    const plugin = rehypePlugin();
    plugin(tree);

    expect(tree.children).toHaveLength(2);
    expect((tree.children[0] as any).tagName).toBe('lobeArtifact');
    expect((tree.children[1] as any).tagName).toBe('lobeArtifact');
  });
});
