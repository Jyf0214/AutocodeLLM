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
 * Scroll methods exposed by VList, stored as callable functions
 */
export interface VirtuaScrollMethods {
  getItemOffset: (index: number) => number;
  getItemSize: (index: number) => number;
  getScrollOffset: () => number;
  getScrollSize: () => number;
  getViewportSize: () => number;
  scrollTo: (offset: number) => void;
  scrollToIndex: (
    index: number,
    options?: { align?: 'start' | 'center' | 'end'; smooth?: boolean },
  ) => void;
}

/**
 * Visible item metrics for active index calculation
 */
export interface VisibleItemMetrics {
  bottom: number;
  ratio: number;
  top: number;
}

export interface VirtuaListState {
  /**
   * Currently active (most visible) message index
   */
  activeIndex: number | null;

  /**
   * Whether the list is at the bottom
   */
  atBottom: boolean;

  /**
   * Whether the list is currently scrolling
   */
  isScrolling: boolean;

  /**
   * Scroll methods from VList instance
   */
  virtuaScrollMethods: VirtuaScrollMethods | null;

  /**
   * Visible items metrics map (index -> metrics)
   */
  visibleItems: Map<number, VisibleItemMetrics>;
}

export const virtuaListInitialState: VirtuaListState = {
  activeIndex: null,
  atBottom: true,
  isScrolling: false,
  virtuaScrollMethods: null,
  visibleItems: new Map(),
};
