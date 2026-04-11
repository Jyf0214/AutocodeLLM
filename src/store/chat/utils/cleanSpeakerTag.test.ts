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

import { cleanSpeakerTag } from './cleanSpeakerTag';

describe('cleanSpeakerTag', () => {
  describe('should remove speaker tag from beginning', () => {
    it('should remove speaker tag with newline', () => {
      const input = '<speaker name="Weather Expert" />\nHello, the weather is sunny!';
      const expected = 'Hello, the weather is sunny!';
      expect(cleanSpeakerTag(input)).toBe(expected);
    });

    it('should remove speaker tag without newline', () => {
      const input = '<speaker name="Weather Expert" />Hello!';
      const expected = 'Hello!';
      expect(cleanSpeakerTag(input)).toBe(expected);
    });

    it('should handle speaker tag with special characters in name', () => {
      const input = '<speaker name="AI Assistant 2.0" />\nResponse content';
      const expected = 'Response content';
      expect(cleanSpeakerTag(input)).toBe(expected);
    });

    it('should handle speaker tag with Chinese characters in name', () => {
      const input = '<speaker name="天气专家" />\n今天天气晴朗';
      const expected = '今天天气晴朗';
      expect(cleanSpeakerTag(input)).toBe(expected);
    });

    it('should handle speaker tag with extra spaces', () => {
      const input = '<speaker  name="Agent"  />\nContent';
      const expected = 'Content';
      expect(cleanSpeakerTag(input)).toBe(expected);
    });

    it('should remove IM bot speaker tag with id/username/nickname', () => {
      const input = '<speaker id="ou_abc123" username="ou_abc123" nickname="ou_abc123" />\nhello';
      const expected = 'hello';
      expect(cleanSpeakerTag(input)).toBe(expected);
    });

    it('should remove IM bot speaker tag with avatar', () => {
      const input = '<speaker id="123" username="john" nickname="John Doe" avatar="abc" />\nHello!';
      const expected = 'Hello!';
      expect(cleanSpeakerTag(input)).toBe(expected);
    });
  });

  describe('should not modify content without speaker tag', () => {
    it('should return content unchanged if no speaker tag', () => {
      const input = 'Hello, how are you?';
      expect(cleanSpeakerTag(input)).toBe(input);
    });

    it('should not remove speaker tag in the middle of content', () => {
      const input = 'Hello <speaker name="Agent" /> world';
      expect(cleanSpeakerTag(input)).toBe(input);
    });

    it('should not remove speaker tag at the end', () => {
      const input = 'Hello world <speaker name="Agent" />';
      expect(cleanSpeakerTag(input)).toBe(input);
    });

    it('should handle empty string', () => {
      expect(cleanSpeakerTag('')).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should only remove the first speaker tag if model outputs multiple', () => {
      const input = '<speaker name="Agent1" />\n<speaker name="Agent2" />\nContent';
      const expected = '<speaker name="Agent2" />\nContent';
      expect(cleanSpeakerTag(input)).toBe(expected);
    });

    it('should handle speaker tag with empty name', () => {
      const input = '<speaker name="" />\nContent';
      const expected = 'Content';
      expect(cleanSpeakerTag(input)).toBe(expected);
    });

    it('should not match malformed speaker tags', () => {
      // Missing closing />
      const input1 = '<speaker name="Agent">\nContent';
      expect(cleanSpeakerTag(input1)).toBe(input1);

      // No attributes at all
      const input2 = '<speaker />\nContent';
      expect(cleanSpeakerTag(input2)).toBe(input2);
    });

    it('should handle content that is only the speaker tag', () => {
      const input = '<speaker name="Agent" />';
      expect(cleanSpeakerTag(input)).toBe('');
    });

    it('should handle content that is only the speaker tag with newline', () => {
      const input = '<speaker name="Agent" />\n';
      expect(cleanSpeakerTag(input)).toBe('');
    });
  });
});
