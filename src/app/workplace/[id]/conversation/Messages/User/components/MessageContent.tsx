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

import { Flexbox } from '@lobehub/ui';
import { memo, useMemo } from 'react';

import MarkdownMessage from '@/features/Conversation/Markdown';
import { cleanSpeakerTag } from '@/store/chat/utils/cleanSpeakerTag';
import { type UIChatMessage } from '@/types/index';

import { useMarkdown } from '../useMarkdown';
import FileListViewer from './FileListViewer';
import ImageFileListViewer from './ImageFileListViewer';
import PageSelections from './PageSelections';
import RichTextMessage from './RichTextMessage';
import VideoFileListViewer from './VideoFileListViewer';

const UserMessageContent = memo<UIChatMessage>(
  ({ id, content, editorData, imageList, videoList, fileList, metadata }) => {
    const markdownProps = useMarkdown(id);
    const pageSelections = metadata?.pageSelections;
    const displayContent = useMemo(() => (content ? cleanSpeakerTag(content) : content), [content]);

    const hasEditorData =
      editorData && typeof editorData === 'object' && Object.keys(editorData).length > 0;

    return (
      <Flexbox gap={8} id={id}>
        {pageSelections && pageSelections.length > 0 && (
          <PageSelections selections={pageSelections} />
        )}
        {hasEditorData ? (
          <RichTextMessage editorState={editorData} />
        ) : (
          displayContent && <MarkdownMessage {...markdownProps}>{displayContent}</MarkdownMessage>
        )}
        {imageList && imageList?.length > 0 && <ImageFileListViewer items={imageList} />}
        {videoList && videoList?.length > 0 && <VideoFileListViewer items={videoList} />}
        {fileList && fileList?.length > 0 && <FileListViewer items={fileList} />}
      </Flexbox>
    );
  },
);

export default UserMessageContent;
