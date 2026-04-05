/**
 * MCP 服务 API 类型定义
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

export interface McpServerResponse {
  success: boolean;
  data?: McpServer | McpServer[];
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateMcpServerRequest {
  name: string;
  url: string;
  enabled?: boolean;
}

export interface UpdateMcpServerRequest {
  id: string;
  name?: string;
  url?: string;
  enabled?: boolean;
  status?: string;
  tools?: string[];
}

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
