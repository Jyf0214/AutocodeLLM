/**
 * 数据库响应工具函数
 * 提供 Prisma 错误处理和标准化响应
 */

import { errorResponse } from './response';

/**
 * 处理 Prisma 数据库错误
 * @param error 错误对象
 * @returns 标准化的错误响应
 */
export function handlePrismaError(error: unknown): ReturnType<typeof errorResponse> {
  const message = error instanceof Error ? error.message : '未知错误';

  // Prisma 常见错误码映射
  if (message.includes('P2002')) {
    return errorResponse('记录已存在（唯一约束冲突）', 'UNIQUE_CONSTRAINT', 409);
  }

  if (message.includes('P2025')) {
    return errorResponse('记录不存在', 'NOT_FOUND', 404);
  }

  if (message.includes('P1001') || message.includes('P1002')) {
    return errorResponse('数据库连接失败', 'DB_CONNECTION', 503);
  }

  if (message.includes('P2014')) {
    return errorResponse('关联记录不存在', 'RELATION_ERROR', 400);
  }

  return errorResponse('数据库操作失败', 'DB_ERROR', 500);
}

export { successResponse, errorResponse, paginatedResponse } from './response';