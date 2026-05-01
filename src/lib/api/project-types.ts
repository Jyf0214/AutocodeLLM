/**
 * 项目 API 类型定义
 */

/**
 * 项目列表项
 */
export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  accessPassword: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 项目详情
 */
export interface ProjectDetail extends ProjectListItem {}

/**
 * 创建项目请求
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

/**
 * 更新项目请求
 */
export interface UpdateProjectRequest {
  id: string;
  name?: string;
  description?: string;
}

/**
 * 项目响应
 */
export interface ProjectResponse {
  success: boolean;
  data?: ProjectListItem | ProjectListItem[];
  error?: {
    message: string;
    code: string;
  };
}
