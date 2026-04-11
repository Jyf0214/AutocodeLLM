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

'use client';

import { type CSSProperties } from 'react';
import { memo } from 'react';

import { type FileListItem } from '@/types/files';

import NotSupport from './NotSupport';
import CodeViewer from './Renderer/Code';
import ImageViewer from './Renderer/Image';
import MSDocViewer from './Renderer/MSDoc';
import PDFViewer from './Renderer/PDF';
import VideoViewer from './Renderer/Video';

// File type definitions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
const IMAGE_MIME_TYPES = new Set([
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
]);

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'];
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg', 'mp4', 'webm', 'ogg']);

const CODE_EXTENSIONS = [
  // JavaScript/TypeScript
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  // Python
  '.py',
  '.pyw',
  // Java/JVM
  '.java',
  '.kt',
  '.kts',
  '.scala',
  '.groovy',
  // C/C++
  '.c',
  '.h',
  '.cpp',
  '.cxx',
  '.cc',
  '.hpp',
  '.hxx',
  // Other compiled languages
  '.cs',
  '.go',
  '.rs',
  '.rb',
  '.php',
  '.swift',
  '.lua',
  '.r',
  '.dart',
  // Shell
  '.sh',
  '.bash',
  '.zsh',
  // Web
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.sass',
  '.less',
  // Data formats
  '.json',
  '.xml',
  '.yaml',
  '.yml',
  '.toml',
  '.sql',
  // Functional languages
  '.ex',
  '.exs',
  '.erl',
  '.hrl',
  '.clj',
  '.cljs',
  '.cljc',
  // Markdown
  '.md',
  '.mdx',
  // Other
  '.vim',
  '.graphql',
  '.gql',
  '.txt',
];

const CODE_MIME_TYPES = new Set([
  // JavaScript/TypeScript
  'js',
  'jsx',
  'ts',
  'tsx',
  'application/javascript',
  'application/x-javascript',
  'text/javascript',
  'application/typescript',
  'text/typescript',
  // Python
  'python',
  'text/x-python',
  'application/x-python-code',
  // Java/JVM
  'java',
  'text/x-java-source',
  'kotlin',
  'scala',
  // C/C++
  'c',
  'text/x-c',
  'cpp',
  'text/x-c++',
  // Other languages
  'csharp',
  'go',
  'rust',
  'ruby',
  'php',
  'text/x-php',
  'swift',
  'lua',
  'r',
  'dart',
  // Shell
  'bash',
  'shell',
  'text/x-shellscript',
  // Web
  'html',
  'text/html',
  'css',
  'text/css',
  'scss',
  'sass',
  'less',
  // Data
  'json',
  'application/json',
  'xml',
  'text/xml',
  'application/xml',
  'yaml',
  'text/yaml',
  'application/x-yaml',
  'toml',
  'sql',
  'text/x-sql',
  // Markdown
  'md',
  'mdx',
  'text/markdown',
  'text/x-markdown',
  // Other
  'graphql',
  'txt',
  'text/plain',
]);

const MSDOC_EXTENSIONS = ['.doc', '.docx', '.odt', '.ppt', '.pptx', '.xls', '.xlsx'];
const MSDOC_MIME_TYPES = new Set([
  'doc',
  'docx',
  'odt',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

// Archive file types - not supported for preview
const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tgz'];
const ARCHIVE_MIME_TYPES = new Set([
  'zip',
  'rar',
  '7z',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip',
  'application/x-bzip2',
  'application/x-xz',
]);

// Helper function to check file type
const matchesFileType = (
  fileType: string | undefined,
  fileName: string | undefined,
  extensions: string[],
  mimeTypes: Set<string>,
): boolean => {
  const lowerFileType = fileType?.toLowerCase();
  const lowerFileName = fileName?.toLowerCase();

  // Check MIME type
  if (lowerFileType && mimeTypes.has(lowerFileType)) {
    return true;
  }

  // Check file extension in fileType
  if (lowerFileType && extensions.some((ext) => lowerFileType.includes(ext.slice(1)))) {
    return true;
  }

  // Check file extension in fileName
  if (lowerFileName && extensions.some((ext) => lowerFileName.endsWith(ext))) {
    return true;
  }

  return false;
};

interface FileViewerProps extends FileListItem {
  className?: string;
  style?: CSSProperties;
}

/**
 * Preview any file type.
 */
const FileViewer = memo<FileViewerProps>(({ id, style, fileType, url, name }) => {
  // PDF files
  if (fileType?.toLowerCase() === 'pdf' || name?.toLowerCase().endsWith('.pdf')) {
    return <PDFViewer fileId={id} url={url} />;
  }

  // Image files
  if (matchesFileType(fileType, name, IMAGE_EXTENSIONS, IMAGE_MIME_TYPES)) {
    return <ImageViewer fileId={id} url={url} />;
  }

  // Video files
  if (matchesFileType(fileType, name, VIDEO_EXTENSIONS, VIDEO_MIME_TYPES)) {
    return <VideoViewer fileId={id} url={url} />;
  }

  // Archive files (zip, rar, 7z, etc.) - not supported for preview
  // Check before code files to avoid false matches
  if (matchesFileType(fileType, name, ARCHIVE_EXTENSIONS, ARCHIVE_MIME_TYPES)) {
    return <NotSupport fileName={name} style={style} url={url} />;
  }

  // Microsoft Office documents - check before code files to avoid false matches
  // (e.g., 'doc' contains 'c' which would match CODE_EXTENSIONS)
  if (matchesFileType(fileType, name, MSDOC_EXTENSIONS, MSDOC_MIME_TYPES)) {
    return <MSDocViewer fileId={id} url={url} />;
  }

  // Code files (JavaScript, TypeScript, Python, Java, C++, Go, Rust, Markdown, etc.)
  if (matchesFileType(fileType, name, CODE_EXTENSIONS, CODE_MIME_TYPES)) {
    return <CodeViewer fileId={id} fileName={name} url={url} />;
  }

  // Unsupported file type
  return <NotSupport fileName={name} style={style} url={url} />;
});

export default FileViewer;
