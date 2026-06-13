/** 文件信息 */
export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: string;
  extension: string;
}

/** API 响应 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; code: string };
}
