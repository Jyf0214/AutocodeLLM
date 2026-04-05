import { NextRequest, NextResponse } from 'next/server';

export interface DiscoveredModel {
  id: string;
  name: string;
  owner?: string | undefined;
  created?: number | undefined;
}

export interface DiscoverRequest {
  baseUrl: string;
  apiKey: string;
}

export interface DiscoverResponse {
  success: boolean;
  data?: DiscoveredModel[];
  error?: {
    message: string;
    code: string;
  };
}

/**
 * POST /api/models/discover
 * 通过 OpenAI 兼容的 /v1/models 端点发现可用模型
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DiscoverRequest;
    const { baseUrl, apiKey } = body;

    if (!baseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 API Base URL',
            code: 'MISSING_BASE_URL',
          },
        } as DiscoverResponse,
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 API Key',
            code: 'MISSING_API_KEY',
          },
        } as DiscoverResponse,
        { status: 400 }
      );
    }

    // 标准化 baseUrl，确保以 /v1/models 结尾
    const normalizedUrl = baseUrl.replace(/\/+$/, '');
    const modelsUrl = normalizedUrl.includes('/v1/models')
      ? normalizedUrl
      : `${normalizedUrl}/v1/models`;

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'API Key 无效或权限不足',
              code: 'AUTH_FAILED',
            },
          } as DiscoverResponse,
          { status: 401 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: '不支持的 API 端点，请确认 Base URL 是否正确（应包含 /v1）',
              code: 'ENDPOINT_NOT_FOUND',
            },
          } as DiscoverResponse,
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: `服务器错误 (${String(response.status)}): ${errorText || '未知错误'}`,
            code: 'SERVER_ERROR',
          },
        } as DiscoverResponse,
        { status: response.status }
      );
    }

    const data = await response.json();

    // OpenAI 兼容格式：{ data: [{ id, object, created, owned_by }, ...] }
    const rawModels = data?.data ?? data?.models ?? [];

    if (!Array.isArray(rawModels)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'API 返回格式不正确，无法解析模型列表',
            code: 'INVALID_RESPONSE',
          },
        } as DiscoverResponse,
        { status: 422 }
      );
    }

    const models: DiscoveredModel[] = rawModels.map((model: Record<string, unknown>) => {
      const idValue = (model.id as string | undefined) ?? (model.name as string | undefined);
      const ownedBy = model.owned_by as string | undefined;
      const created = model.created as number | undefined;

      return {
        id: idValue ?? 'unknown',
        name: idValue ?? 'Unknown Model',
        owner: ownedBy,
        created,
      };
    });

    return NextResponse.json({
      success: true,
      data: models,
    } as DiscoverResponse);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '请求超时，请检查网络连接和 API 地址',
            code: 'TIMEOUT',
          },
        } as DiscoverResponse,
        { status: 408 }
      );
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '网络连接失败，请检查 API 地址是否正确',
            code: 'NETWORK_ERROR',
          },
        } as DiscoverResponse,
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: '探测模型失败，请稍后重试',
          code: 'DISCOVER_FAILED',
        },
      } as DiscoverResponse,
      { status: 500 }
    );
  }
}
