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

import { ARTIFACT_THINKING_TAG_REGEX } from '@lobechat/const';

/**
 * Replace all line breaks in the matched `lobeArtifact` tag with an empty string
 */
export const processWithArtifact = (input: string = '') => {
  // First remove outer fenced code block if it exists
  /* eslint-disable regexp/no-super-linear-backtracking */
  let output = input.replace(
    /^([\s\S]*?)\s*```[^\n]*\n((?:<lobeThinking>[\s\S]*?<\/lobeThinking>[\t\v\f\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*\n\s*)?<lobeArtifact[\s\S]*?<\/lobeArtifact>\s*)\n```\s*([\s\S]*)$/,
    (_, before = '', content, after = '') => {
      return [before.trim(), content.trim(), after.trim()].filter(Boolean).join('\n\n');
    },
  );
  /* eslint-enable regexp/no-super-linear-backtracking */

  const thinkMatch = ARTIFACT_THINKING_TAG_REGEX.exec(output);

  // If the input contains the `lobeThinking` tag, replace all line breaks with an empty string
  if (thinkMatch) {
    output = output.replace(ARTIFACT_THINKING_TAG_REGEX, (match) =>
      match.replaceAll(/\r?\n|\r/g, ''),
    );
  }

  // Add empty line between lobeThinking and lobeArtifact if they are adjacent
  // Support both cases: with line break (e.g. from other models) and without (e.g. from Gemini)
  output = output.replace(/(<\/lobeThinking>)(?:\r?\n)?(<lobeArtifact)/, '$1\n\n$2');

  // Remove fenced code block between lobeArtifact and HTML content
  output = output.replace(
    /(<lobeArtifact[^>]*>)\s*```[^\n]*\n([\s\S]*?)(```\n)?(<\/lobeArtifact>)/,
    (_, start, content, __, end) => {
      if (content.trim().startsWith('<!DOCTYPE html') || content.trim().startsWith('<html')) {
        return start + content.trim() + end;
      }
      return start + content + (__ || '') + end;
    },
  );

  // Keep existing code blocks that are not part of lobeArtifact
  output = output.replace(
    /^([\s\S]*?)(<lobeThinking>[\s\S]*?<\/lobeThinking>[\t\v\f\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*\n\s*<lobeArtifact[\s\S]*?<\/lobeArtifact>)([\s\S]*)$/,
    (_, before, content, after) => {
      return [before.trim(), content.trim(), after.trim()].filter(Boolean).join('\n\n');
    },
  );

  // If the input contains `lobeArtifact` tags, replace all line breaks with an empty string
  // Use global regex to handle multiple artifacts in the same message
  const ARTIFACT_TAG_REGEX_GLOBAL =
    /<lobeArtifact\b[^>]*>(?<content>[\S\s]*?)(?:<\/lobeArtifact>|$)/g;
  output = output.replaceAll(ARTIFACT_TAG_REGEX_GLOBAL, (match) =>
    match.replaceAll(/\r?\n|\r/g, ''),
  );

  // if not match, check if it's start with <lobeArtifact but not closed
  const regex = /<lobeArtifact\b(?:(?!\/?>)[\s\S])*$/;
  if (regex.test(output)) {
    output = output.replace(regex, '<lobeArtifact>');
  }

  return output;
};

// Preprocessing function: ensure two newlines before and after think tags
export const normalizeThinkTags = (input: string) => {
  return (
    input
      // Ensure two newlines before and after <think> tags
      .replaceAll(/([^\n])\s*<think>/g, '$1\n\n<think>')
      .replaceAll(/<think>\s*([^\n])/g, '<think>\n\n$1')
      // Ensure two newlines before and after </think> tags
      .replaceAll(/([^\n])\s*<\/think>/g, '$1\n\n</think>')
      .replaceAll(/<\/think>\s*([^\n])/g, '</think>\n\n$1')
      // Remove excess newlines that may have been introduced
      .replaceAll(/\n{3,}/g, '\n\n')
  );
};
