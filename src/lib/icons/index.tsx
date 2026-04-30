// AutocodeLLM 图标库
// 基于 @lobehub/icons 包，提供统一的图标导出接口

export {
  // 功能性图标组件
  ModelIcon,
  ModelTag,
  IconAvatar,
  IconCombine,
  ProviderIcon,
  ProviderCombine,
  AgentIcon,
  // 提供商枚举与配置
  ModelProvider,
  modelMappings,
  providerMappings,
  agentMappings,
  // CDN 工具
  getLobeIconCDN,
  // 类型导出
  type ModelIconProps,
  type ModelTagProps,
  type IconAvatarProps,
  type IconCombineProps,
  type ProviderIconProps,
  type ProviderCombineProps,
  type AgentIconProps,
  type LobeIconCdnConfig,
  type ModelProviderKey,
} from '@lobehub/icons';

// AI 提供商图标（直接从 @lobehub/icons 重新导出）
export {
  OpenAI,
  Azure,
  Google,
  Anthropic,
  Bedrock,
  Claude,
  Ollama,
  DeepSeek,
  Qwen,
  Grok,
  XAI,
  Perplexity,
  Together,
  HuggingFace,
  Dify,
  Moonshot,
  Minimax,
  Baidu,
  Stepfun,
  ByteDance,
  Exa,
  VertexAI,
  Aws,
} from '@lobehub/icons';

// 兼容旧命名
export { OpenAI as OpenAIIcon } from '@lobehub/icons';
export { Google as GoogleIcon } from '@lobehub/icons';
export { Bedrock as BedrockIcon } from '@lobehub/icons';
export { Claude as CliaudeIcon } from '@lobehub/icons';
export { Ollama as OllamaIcon } from '@lobehub/icons';
export { DeepSeek as DeepSeekIcon } from '@lobehub/icons';
export { Qwen as QwenIcon } from '@lobehub/icons';
export { Grok as GrokIcon } from '@lobehub/icons';
export { XAI as XAIIcon } from '@lobehub/icons';
export { Perplexity as PerplexityIcon } from '@lobehub/icons';
export { Together as TogetherAIIcon } from '@lobehub/icons';
export { HuggingFace as HuggingFaceIcon } from '@lobehub/icons';
export { Dify as DifyIcon } from '@lobehub/icons';
export { Moonshot as MoonshotIcon } from '@lobehub/icons';
export { Minimax as MiniMaxIcon } from '@lobehub/icons';
export { Baidu as BaiduIcon } from '@lobehub/icons';
export { Stepfun as StepfunIcon } from '@lobehub/icons';
export { ByteDance as BytedanceIcon } from '@lobehub/icons';
export { Exa as ExaIcon } from '@lobehub/icons';

// 通用图标属性类型（向后兼容）
export type IconComponentProps = React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
