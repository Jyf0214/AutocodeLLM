/**
 * 模型批量添加 API
 * POST /api/models/bulk - 批量添加模型配置
 */

import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type { BulkAddResponse } from '@/lib/api/model-types';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/**
 * POST /api/models/bulk - 批量添加模型配置
 */
export const POST = withApiLogging('POST models/bulk', async function POST(
  request: Request,
): Promise<NextResponse<BulkAddResponse>>  {
  try {
    const body = (await request.json()) as {
      models?: { name: string; provider: string; apiKey: string; baseUrl?: string }[];
    };
    const models = body.models;

    if (!Array.isArray(models) || models.length === 0) {
      return errorResponse('缺少模型数据或数据为空', 'INVALID_INPUT', 400);
    }

    const added: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const model of models) {
      const { name, provider, apiKey, baseUrl } = model;

      if (!name || !provider || !apiKey) {
        errors.push(`跳过 "${name || '未知'}"：缺少必填字段`);
        continue;
      }

      try {
    const db = await getPrisma();
        const existing = await db.provider.findUnique({
          where: { name },
        });

        if (existing) {
          skipped.push(name);
          continue;
        }

        await db.provider.create({
          data: {
            name,
            baseUrl: baseUrl ?? '',
            apiKey,
            enabled: true,
          },
        });

        added.push(name);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        errors.push(`添加 "${name}" 失败：${errorMessage}`);
      }
    }

    return successResponse({
      added: added.length,
      skipped: skipped.length,
      errors,
    });
  } catch (error) {
    return handleError(error, '批量添加模型');
  }
});
