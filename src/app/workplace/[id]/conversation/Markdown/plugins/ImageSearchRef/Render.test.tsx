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

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as storeModule from '../../../store';
import Render from './Render';

vi.mock('../../../store', async (importOriginal) => {
  const original = await importOriginal<typeof storeModule>();
  return { ...original, useConversationStore: vi.fn() };
});

const mockUseConversationStore = vi.mocked(storeModule.useConversationStore);

const MESSAGE_ID = 'msg-test-1';

const makeProps = (imageIndex: number, originalText: string) => ({
  children: null,
  id: MESSAGE_ID,
  node: { properties: { imageIndex, originalText } },
  tagName: 'image-search-ref',
  type: 'element',
});

describe('ImageSearchRef Render', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fallback: no image results', () => {
    it('should render plain text when imageResults is undefined', () => {
      mockUseConversationStore.mockReturnValue(undefined);
      render(<Render {...(makeProps(0, 'image_0.png') as any)} />);
      expect(screen.getByText('image_0.png')).toBeInTheDocument();
      expect(screen.queryByRole('link')).toBeNull();
    });

    it('should render plain text when imageResults is an empty array', () => {
      mockUseConversationStore.mockReturnValue([]);
      render(<Render {...(makeProps(0, 'image_0.png') as any)} />);
      expect(screen.getByText('image_0.png')).toBeInTheDocument();
      expect(screen.queryByRole('link')).toBeNull();
    });

    it('should render plain text when imageIndex is out of bounds', () => {
      mockUseConversationStore.mockReturnValue([
        {
          domain: 'example.com',
          imageUri: 'https://img.example.com/0.jpg',
          sourceUri: 'https://example.com',
          title: 'Photo',
        },
      ]);
      render(<Render {...(makeProps(5, 'image_5.png') as any)} />);
      expect(screen.getByText('image_5.png')).toBeInTheDocument();
      expect(screen.queryByRole('link')).toBeNull();
    });
  });

  describe('chip: with image results', () => {
    const imageResult = {
      domain: 'example.com',
      imageUri: 'https://img.example.com/0.jpg',
      sourceUri: 'https://example.com/photo',
      title: 'A Sample Photo',
    };

    beforeEach(() => {
      mockUseConversationStore.mockReturnValue([imageResult]);
    });

    it('should render an anchor chip linking to imageUri', () => {
      render(<Render {...(makeProps(0, 'image_0.png') as any)} />);
      // Popover wraps the trigger <a> and adds role="button" via base-ui,
      // so query by role "button" (the chip) and verify href/target attributes.
      const chip = screen.getByRole('button', { name: 'image_0.png' });
      expect(chip).toHaveAttribute('href', imageResult.imageUri);
      expect(chip).toHaveAttribute('target', '_blank');
    });

    it('should show originalText inside the chip', () => {
      render(<Render {...(makeProps(0, 'image_0.png') as any)} />);
      expect(screen.getByText('image_0.png')).toBeInTheDocument();
    });
  });
});
