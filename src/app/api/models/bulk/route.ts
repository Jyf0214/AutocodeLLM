import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface BulkAddRequest {
  models: {
    name: string;
    provider: string;
    apiKey: string;
    baseUrl?: string;
  }[];
}

interface BulkAddResult {
  success: boolean;
  data?: {
    added: number;
    skipped: number;
    errors: string[];
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * POST /api/models/bulk
 * 批量添加模型配置
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BulkAddRequest;
    const { models } = body;

    if (!Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少模型数据或数据为空',
            code: 'INVALID_INPUT',
          },
        } as BulkAddResult,
        { status: 400 }
      );
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
        errors.push(`添加 "${name}" 失败：${err instanceof Error ? err.message : '未知错误'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        added: added.length,
        skipped: skipped.length,
        errors,
      },
    } as BulkAddResult);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '批量添加模型失败',
          code: 'BULK_ADD_FAILED',
        },
      } as BulkAddResult,
      { status: 500 }
    );
  }
}
