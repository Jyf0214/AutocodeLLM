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
 * Inject a refer-topic node at the beginning of editorData.
 * Prepends a new paragraph containing the refer-topic node before existing content.
 */
export const injectReferTopicNode = (
  editorData: Record<string, any> | undefined,
  topicId: string,
  topicTitle: string,
): Record<string, any> => {
  const referTopicNode = {
    type: 'refer-topic',
    topicId,
    topicTitle,
    version: 1,
  };

  const referParagraph = {
    children: [referTopicNode],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  };

  // If no editorData, create a minimal structure with just the referTopic
  if (!editorData?.root) {
    return {
      root: {
        children: [referParagraph],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };
  }

  // Deep clone and prepend refer-topic paragraph
  const cloned = structuredClone(editorData);
  const existingChildren = cloned.root.children || [];
  cloned.root.children = [referParagraph, ...existingChildren];
  return cloned;
};
