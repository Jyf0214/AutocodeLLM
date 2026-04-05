/**
 * 预置提供商配置数据
 * 包含常用 AI 提供商的默认配置信息
 */

export interface PresetProvider {
  id: string;
  name: string;
  nameEn?: string;
  baseUrl?: string;
  apiKeyUrl?: string;
  sdkType: string;
  authType: string;
  openaiCompatible: boolean;
  checkModel?: string;
  icon?: string;
  description?: string;
}

export const PRESET_PROVIDERS: PresetProvider[] = [
  {
    id: 'nvidia',
    name: 'NVIDIA',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKeyUrl: 'https://build.nvidia.com/explore/discover',
    sdkType: 'openai',
    authType: 'bearer',
    openaiCompatible: true,
    checkModel: 'meta/llama-3.1-8b-instruct',
    description: 'NVIDIA NIM API，提供多种开源模型推理',
  },
  {
    id: 'qwen',
    name: '通义千问',
    nameEn: 'Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyUrl: 'https://bailian.console.aliyun.com/?apiKey=1#/api-key',
    sdkType: 'openai',
    authType: 'bearer',
    openaiCompatible: true,
    checkModel: 'qwen-plus',
    description: '阿里云通义千问官方 API（支持 OAuth 登录）',
  },
];
