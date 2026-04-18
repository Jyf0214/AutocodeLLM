/**
 * 工作空间 API 类型定义
 */

/**
 * 工作空间列表项
 */
export interface WorkspaceListItem {
  id: string;
  name: string;
  description: string;
  accessPassword: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 工作空间详情
 */
export interface WorkspaceDetail extends WorkspaceListItem {}

/**
 * 创建工作空间请求
 */
export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

/**
 * 更新工作空间请求
 */
export interface UpdateWorkspaceRequest {
  id: string;
  name?: string;
  description?: string;
}

/**
 * 工作空间响应
 */
export interface WorkspaceResponse {
  success: boolean;
  data?: WorkspaceListItem | WorkspaceListItem[];
  error?: {
    message: string;
    code: string;
  };
}
