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

// Use Vite's ?url import to get the correct hashed asset path (e.g. /_spa/assets/pdf.worker-xxx.mjs)
// This overrides react-pdf's auto-detected bare filename which breaks under SPA routing.
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { type ComponentProps } from 'react';
import { Document as PdfDocument, type Page as PdfPage, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export type DocumentProps = ComponentProps<typeof PdfDocument>;
export type PageProps = ComponentProps<typeof PdfPage>;

export const Document = (props: DocumentProps) => {
  return <PdfDocument {...props} />;
};

export { Page, pdfjs } from 'react-pdf';
