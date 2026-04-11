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

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Flexbox } from '@lobehub/ui';
import { Fragment, memo, useCallback, useState } from 'react';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';
import { Document, Page, pdfjs } from '@/libs/pdfjs';
import { lambdaQuery } from '@/libs/trpc/client';

import HighlightLayer from './HighlightLayer';
import { styles } from './style';
import useResizeObserver from './useResizeObserver';

const options = {
  cMapUrl: `https://registry.npmmirror.com/pdfjs-dist/${pdfjs.version}/files/cmaps/`,
  standardFontDataUrl: `https://registry.npmmirror.com/pdfjs-dist/${pdfjs.version}/files/standard_fonts/`,
};

const maxWidth = 1200;

interface PDFViewerProps {
  fileId: string;
  url: string | null;
}

const PDFViewer = memo<PDFViewerProps>(({ url, fileId }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [isLoaded, setIsLoaded] = useState(false);

   
  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;

    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useResizeObserver(containerRef, onResize);

  const onDocumentLoadSuccess = (document: unknown) => {
    setNumPages((document as { numPages: number }).numPages);
    setIsLoaded(true);
  };

  const { data } = lambdaQuery.chunk.getChunksByFileId.useInfiniteQuery(
    { id: fileId },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const dataSource = data?.pages.flatMap((page) => page.items) || [];

  return (
    <Flexbox className={styles.container}>
      <Flexbox
        align={'center'}
        className={styles.documentContainer}
        justify={isLoaded ? undefined : 'center'}
        padding={24}
        ref={setContainerRef}
      >
        <Document
          className={styles.document}
          file={url}
          loading={<NeuralNetworkLoading size={36} />}
          options={options}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          {Array.from({ length: numPages }, (_, index) => {
            const width = containerWidth ? Math.min(containerWidth, maxWidth) : maxWidth;

            return (
              <Fragment key={`page_${index + 1}`}>
                <Page className={styles.page} pageNumber={index + 1} width={width}>
                  <HighlightLayer dataSource={dataSource} pageNumber={index + 1} width={width} />
                </Page>
              </Fragment>
            );
          })}
        </Document>
      </Flexbox>
    </Flexbox>
  );
});

export default PDFViewer;
