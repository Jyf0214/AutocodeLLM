/**
 * 工作空间 API 类型定义
 */

export interface WorkspaceListItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceResponse {
  success: boolean;
  data?: WorkspaceListItem | WorkspaceListItem[];
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}
