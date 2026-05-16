/**
 * 模型发现 API
 * POST /api/models/discover - 发现 OpenAI 兼容的模型
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type { DiscoverResponse } from '@/lib/api/model-types';

/**
 * POST /api/models/discover - 通过 OpenAI 兼容的/v1/models端点发现可用模型
 */
export const POST = withApiLogging('POST models/discover', async function POST(
  request: NextRequest,
): Promise<NextResponse<DiscoverResponse>>  {
  try {
    const body = (await request.json()) as {
      baseUrl: string;
      apiKey: string;
    };
    const { baseUrl, apiKey } = body;

    if (!baseUrl) {
      return errorResponse('缺少 API Base URL', 'MISSING_BASE_URL', 400);
    }

    if (!apiKey) {
      return errorResponse('缺少 API Key', 'MISSING_API_KEY', 400);
    }

    // 标准化 URL
    const normalizedUrl = baseUrl.replace(/\/+$/, '');
    const modelsUrl = normalizedUrl.endsWith('/v1')
      ? `${normalizedUrl}/models`
      : normalizedUrl.includes('/v1/models')
        ? normalizedUrl
        : `${normalizedUrl}/v1/models`;

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');

      if (response.status === 401 || response.status === 403) {
        return errorResponse('API Key 无效或权限不足', 'AUTH_FAILED', 401);
      }

      if (response.status === 404) {
        return errorResponse(
          '不支持的 API 端点，请确认 Base URL 是否正确（应包含/v1）',
          'ENDPOINT_NOT_FOUND',
          404,
        );
      }

      return errorResponse(
        `服务器错误 (${String(response.status)}): ${errorText || '未知错误'}`,
        'SERVER_ERROR',
        response.status,
      );
    }

    const data = await response.json();
    const rawModels = data?.data ?? data?.models ?? [];

    if (!Array.isArray(rawModels)) {
      return errorResponse(
        'API 返回格式不正确，无法解析模型列表',
        'INVALID_RESPONSE',
        422,
      );
    }

    const models = rawModels.map(
      (model: Record<string, unknown>) => ({
        id: (model.id as string | undefined) ?? 'unknown',
        name: (model.id as string | undefined) ?? 'Unknown Model',
        owner: model.owned_by as string | undefined,
        created: model.created as number | undefined,
      }),
    );

    return successResponse(models);
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')
    ) {
      return errorResponse(
        '请求超时，请检查网络连接和 API 地址',
        'TIMEOUT',
        408,
      );
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return errorResponse(
        '网络连接失败，请检查 API 地址是否正确',
        'NETWORK_ERROR',
        502,
      );
    }

    return handleError(error, '探测模型');
  }
});
