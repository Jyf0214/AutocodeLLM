/**
 * 模型批量添加 API
 * POST /api/models/bulk - 批量添加模型配置
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type { BulkAddResponse } from '@/lib/api/model-types';

/**
 * POST /api/models/bulk - 批量添加模型配置
 */
export async function POST(
  request: Request,
): Promise<NextResponse<BulkAddResponse>> {
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
        const existing = await prisma.provider.findUnique({
          where: { name },
        });

        if (existing) {
          skipped.push(name);
          continue;
        }

        await prisma.provider.create({
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
}
