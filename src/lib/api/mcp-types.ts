/**
 * MCP 服务 API 类型定义
 */

/**
 * MCP 服务器
 */
export interface McpServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  status: string;
  tools: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * MCP 服务器响应
 */
export interface McpServerResponse {
  success: boolean;
  data?: McpServer | McpServer[];
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 创建 MCP 服务器请求
 */
export interface CreateMcpServerRequest {
  name: string;
  url: string;
  enabled?: boolean;
}

/**
 * 更新 MCP 服务器请求
 */
export interface UpdateMcpServerRequest {
  id: string;
  name?: string;
  url?: string;
  enabled?: boolean;
  status?: string;
  tools?: string[];
}

/**
 * 测试 MCP 服务器请求和响应
 */
export interface TestMcpServerRequest {
  id: string;
  url: string;
}

export interface TestMcpServerResponse {
  success: boolean;
  data?: {
    connected: boolean;
    latency?: number;
    message: string;
  };
  error?: {
    message: string;
    code: string;
  };
}
