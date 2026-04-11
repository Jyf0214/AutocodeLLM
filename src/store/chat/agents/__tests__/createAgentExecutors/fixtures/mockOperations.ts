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

import { nanoid } from '@lobechat/utils';

import { type Operation, type OperationType } from '@/store/chat/slices/operation/types';

/**
 * Create a mock Operation object for testing
 */
export const createMockOperation = (
  type: OperationType,
  context: Record<string, any> = {},
  overrides: Partial<Operation> = {},
): Operation => {
  return {
    abortController: new AbortController(),
    childOperationIds: [],
    context,
    id: `op_${nanoid()}`,
    metadata: {
      startTime: Date.now(),
    },
    status: 'running',
    type,
    ...overrides,
  };
};

/**
 * Create a cancelled operation
 */
export const createCancelledOperation = (
  type: OperationType,
  context: Record<string, any> = {},
): Operation => {
  const operation = createMockOperation(type, context, { status: 'cancelled' });
  operation.abortController.abort();
  operation.metadata.cancelReason = 'Test cancellation';
  return operation;
};

/**
 * Create a completed operation
 */
export const createCompletedOperation = (
  type: OperationType,
  context: Record<string, any> = {},
): Operation => {
  return createMockOperation(type, context, {
    metadata: {
      duration: 1000,
      endTime: Date.now(),
      startTime: Date.now() - 1000,
    },
    status: 'completed',
  });
};

/**
 * Create a failed operation
 */
export const createFailedOperation = (
  type: OperationType,
  context: Record<string, any> = {},

  error: { message: string; type: string } = { message: 'Test error', type: 'TestError' },
): Operation => {
  return createMockOperation(type, context, {
    metadata: {
      duration: 1000,
      endTime: Date.now(),
      error,
      startTime: Date.now() - 1000,
    },
    status: 'failed',
  });
};

/**
 * Create an operation tree (parent with children)
 */
export const createOperationTree = (
  parentType: OperationType,
  childTypes: OperationType[],
  context: Record<string, any> = {},
) => {
  const parent = createMockOperation(parentType, context);

  const children = childTypes.map((childType) =>
    createMockOperation(childType, context, {
      parentOperationId: parent.id,
    }),
  );

  parent.childOperationIds = children.map((c) => c.id);

  return { children, parent };
};
