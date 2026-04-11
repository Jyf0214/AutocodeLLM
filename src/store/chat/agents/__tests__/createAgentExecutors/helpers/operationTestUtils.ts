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

import { type Operation } from '@/store/chat/slices/operation/types';

/**
 * Simulate operation cancellation
 */
export const simulateOperationCancellation = (
  operation: Operation,
  reason: string = 'Test cancellation',
) => {
  operation.abortController.abort();
  operation.status = 'cancelled';
  if (operation.metadata) {
    operation.metadata.cancelReason = reason;
  }
};

/**
 * Simulate cascading cancellation through operation tree
 */
export const simulateCascadingCancellation = (
  parentOperation: Operation,
  childOperations: Operation[],
  reason: string = 'Parent operation cancelled',
) => {
  simulateOperationCancellation(parentOperation, reason);
  childOperations.forEach((child) => simulateOperationCancellation(child, reason));
};

/**
 * Wait for operation status change
 */
export const waitForOperationStatus = async (
  getOperation: () => Operation | undefined,
  targetStatus: Operation['status'],
  timeout: number = 1000,
): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const operation = getOperation();
    if (operation?.status === targetStatus) {
      return true;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  }
  return false;
};

/**
 * Verify operation tree structure
 */
export const verifyOperationTree = (parent: Operation, expectedChildIds: string[]): boolean => {
  if (!parent.childOperationIds) return false;
  if (parent.childOperationIds.length !== expectedChildIds.length) return false;
  return expectedChildIds.every((id) => parent.childOperationIds!.includes(id));
};

/**
 * Get all operations in a tree (parent + all descendants)
 */
export const getAllOperationsInTree = (
  operations: Record<string, Operation>,
  rootOperationId: string,
): Operation[] => {
  const result: Operation[] = [];
  const visited = new Set<string>();

  const traverse = (operationId: string) => {
    if (visited.has(operationId)) return;
    visited.add(operationId);

    const operation = operations[operationId];
    if (!operation) return;

    result.push(operation);

    if (operation.childOperationIds) {
      operation.childOperationIds.forEach(traverse);
    }
  };

  traverse(rootOperationId);
  return result;
};

/**
 * Create AbortSignal that aborts after delay
 */
export const createDelayedAbortSignal = (delayMs: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), delayMs);
  return controller.signal;
};
