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

import { useEffect } from 'react';

/**
 * Observes a given element using ResizeObserver.
 *
 * @param {Element} [element] Element to attach ResizeObserver to
 * @param {ResizeObserverOptions} [options] ResizeObserver options. WARNING! If you define the
 *   object in component body, make sure to memoize it.
 * @param {ResizeObserverCallback} observerCallback ResizeObserver callback. WARNING! If you define
 *   the function in component body, make sure to memoize it.
 * @returns {void}
 */
export default function useResizeObserver(
  element: Element | null,
   
  observerCallback: ResizeObserverCallback,
   
  options?: ResizeObserverOptions,
): void {
  useEffect(() => {
    if (!element || !('ResizeObserver' in window)) {
      return undefined;
    }

    const observer = new ResizeObserver(observerCallback);

    observer.observe(element, options);

    return () => {
      observer.disconnect();
    };
  }, [element, observerCallback, options]);
}
