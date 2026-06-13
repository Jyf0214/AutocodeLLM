/**
 * 统一 API 响应工具函数
 * 提供标准化的响应格式和错误处理
 */

import { NextResponse } from 'next/server';

/**
 * 标准 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: string;
  };
}

/**
 * 分页响应数据
 */
export interface PaginatedData<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 成功响应
 * @param data 响应数据
 * @param status HTTP 状态码，默认 200
 * @param headers 额外的响应头
 */
export function successResponse<T>(
  data: T,
  status = 200,
  headers?: Record<string, string>,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    } as ApiResponse<T>,
    { status, headers },
  );
}

/**
 * 错误响应
 * @param message 错误消息
 * @param code 错误代码
 * @param status HTTP 状态码，默认 400
 * @param details 详细错误信息（可选）
 */
export function errorResponse(
  message: string,
  code: string,
  status = 400,
  details?: string,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        ...(details && { details }),
      },
    } as ApiResponse<never>,
    { status },
  );
}

/**
 * 分页响应
 * @param items 数据项
 * @param total 总数
 * @param page 当前页码
 * @param limit 每页数量
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): NextResponse<ApiResponse<PaginatedData<T>>> {
  return NextResponse.json({
    success: true,
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  } as ApiResponse<PaginatedData<T>>);
}

/**
 * 验证必填字段
 * @param fields 字段名和值的映射
 * @returns 如果存在空字段，返回错误响应
 */
export function validateRequiredFields(
  fields: Record<string, unknown>,
): NextResponse<ApiResponse<never>> | null {
  const missingFields: string[] = [];

  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(name);
    }
  }

  if (missingFields.length > 0) {
    return errorResponse(
      `缺少必填字段：${missingFields.join('、')}`,
      'MISSING_FIELDS',
      400,
    );
  }

  return null;
}

/**
 * 验证枚举值
 * @param value 要验证的值
 * @param validValues 有效值数组
 * @param fieldName 字段名称
 * @returns 如果无效，返回错误响应
 */
export function validateEnum<T extends string>(
  value: T | undefined,
  validValues: readonly T[],
  fieldName: string,
): NextResponse<ApiResponse<never>> | null {
  if (value === undefined) {
    return null;
  }

  if (!validValues.includes(value)) {
    return errorResponse(
      `无效的${fieldName}：${String(value)}`,
      `INVALID_${fieldName.toUpperCase()}`,
      400,
    );
  }

  return null;
}

/**
 * 捕获 Prisma 错误并返回友好提示
 * @param error 错误对象
 */
export function handlePrismaError(error: unknown): NextResponse<ApiResponse<never>> {
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

  return errorResponse('数据库操作失败', 'DB_ERROR', 500, message);
}

/**
 * 处理未知错误
 * @param error 错误对象
 * @param context 错误上下文信息
 */
export function handleError(error: unknown, context: string): NextResponse<ApiResponse<never>> {
  const message = error instanceof Error ? error.message : '未知错误';

  console.error(`[${context}] 错误:`, message);

  return errorResponse(
    `${context}失败`,
    'INTERNAL_ERROR',
    500,
    process.env.NODE_ENV === 'development' ? message : undefined,
  );
}

/**
 * 解析 JSON 请求体
 * @param request Request 对象
 * @returns 解析后的 JSON 数据或错误响应
 */
export async function parseJsonBody<T>(
  request: Request,
): Promise<T | NextResponse<ApiResponse<never>>> {
  try {
    return await request.json();
  } catch (error) {
    return errorResponse('无效的 JSON 格式', 'INVALID_JSON', 400);
  }
}

/**
 * 检查响应是否为错误响应
 */
export function isErrorResponse(response: unknown): response is NextResponse<ApiResponse<never>> {
  return response instanceof NextResponse && response.status >= 400;
}

/**
 * 掩码敏感值（用于日志/响应）
 */
export function maskValue(value: string | undefined | null): string {
  if (!value) return '****';
  if (value.length <= 8) return '****';
  return value.slice(0, 4) + '****' + value.slice(-4);
}
