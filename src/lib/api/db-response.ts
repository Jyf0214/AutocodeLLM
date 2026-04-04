/**
 * 数据库 API 响应工具函数
 */

import { NextResponse } from 'next/server';

/**
 * 成功响应
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  );
}

/**
 * 错误响应
 */
export function errorResponse(message: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: code ?? 'UNKNOWN_ERROR',
      },
    },
    { status },
  );
}

/**
 * 分页响应
 */
export function paginatedResponse<T>(
  data: T,
  total: number,
  page: number,
  limit: number,
) {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  );
}

/**
 * 捕获 Prisma 错误并返回友好提示
 */
export function handlePrismaError(error: unknown) {
  const message = error instanceof Error ? error.message : '未知错误';

  // Prisma 常见错误码映射
  if (message.includes('P2002')) {
    return errorResponse('记录已存在（唯一约束冲突）', 409, 'UNIQUE_CONSTRAINT');
  }

  if (message.includes('P2025')) {
    return errorResponse('记录不存在', 404, 'NOT_FOUND');
  }

  if (message.includes('P1001') || message.includes('P1002')) {
    return errorResponse('数据库连接失败', 503, 'DB_CONNECTION');
  }

  if (message.includes('P2014')) {
    return errorResponse('关联记录不存在', 400, 'RELATION_ERROR');
  }

  return errorResponse('数据库操作失败', 500, 'DB_ERROR');
}
