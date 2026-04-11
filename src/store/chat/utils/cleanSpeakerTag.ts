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

/**
 * Regex to match speaker tag at the beginning of content
 *
 * Two formats exist:
 * 1. Group chat: <speaker name="Agent Name" />
 * 2. IM bot:     <speaker id="..." username="..." nickname="..." />
 *
 * These tags are injected to identify message senders. Models may accidentally
 * reproduce them in output, and they should be stripped for UI display.
 */
const SPEAKER_TAG_REGEX = /^<speaker\s+\S[^>]*\/>\n?/;

/**
 * Remove speaker tag from the beginning of assistant message content.
 *
 * In group chat scenarios, we inject `<speaker name="..." />` at the beginning
 * of assistant messages to help the model identify who sent each message.
 * However, models may accidentally reproduce this tag in their output.
 * This function removes any such tag from the content.
 *
 * @param content - The message content to clean
 * @returns Content with speaker tag removed (if present)
 *
 * @example
 * ```typescript
 * cleanSpeakerTag('<speaker name="Weather Expert" />\nHello!')
 * // Returns: 'Hello!'
 *
 * cleanSpeakerTag('Hello!')
 * // Returns: 'Hello!'
 * ```
 */
export const cleanSpeakerTag = (content: string): string => {
  return content.replace(SPEAKER_TAG_REGEX, '');
};
