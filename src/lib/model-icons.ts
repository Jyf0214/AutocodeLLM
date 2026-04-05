/**
 * 模型提供商图标映射
 * 使用 @lobehub/icons 提供 AI 品牌图标
 */

import {
  OpenAI,
  Anthropic,
  Claude,
  Gemini,
  Google,
  DeepSeek,
  Qwen,
  Zhipu,
  Baichuan,
  Moonshot,
  Grok,
  Mistral,
  Ollama,
  Meta,
  MetaAI,
  Ai21,
  Aya,
  Yi,
  Minimax,
  Spark,
  SenseNova,
  Stepfun,
  Skywork,
  Hunyuan,
  Doubao,
} from '@lobehub/icons';
import { ApiOutlined } from '@ant-design/icons';

interface ProviderIconMapping {
  keywords: string[];
  icon: React.ComponentType<Record<string, unknown>>;
  label: string;
}

/**
 * 提供商图标映射表
 * 按关键词匹配，优先级从上到下
 */
const PROVIDER_ICON_MAP: ProviderIconMapping[] = [
  { keywords: ['openai', 'open ai'], icon: OpenAI, label: 'OpenAI' },
  { keywords: ['anthropic'], icon: Anthropic, label: 'Anthropic' },
  { keywords: ['claude'], icon: Claude, label: 'Claude' },
  { keywords: ['gemini', 'google ai', 'googleai'], icon: Gemini, label: 'Gemini' },
  { keywords: ['google'], icon: Google, label: 'Google' },
  { keywords: ['deepseek', 'deep seek'], icon: DeepSeek, label: 'DeepSeek' },
  { keywords: ['qwen', '通义千问', '千问'], icon: Qwen, label: 'Qwen' },
  { keywords: ['zhipu', '智谱', 'chatglm'], icon: Zhipu, label: '智谱' },
  { keywords: ['baichuan', '百川'], icon: Baichuan, label: '百川' },
  { keywords: ['moonshot', 'kimi'], icon: Moonshot, label: 'Moonshot' },
  { keywords: ['grok', 'xai', 'x.ai'], icon: Grok, label: 'Grok' },
  { keywords: ['mistral'], icon: Mistral, label: 'Mistral' },
  { keywords: ['ollama'], icon: Ollama, label: 'Ollama' },
  { keywords: ['meta', 'llama'], icon: Meta, label: 'Meta' },
  { keywords: ['metaai', 'meta ai'], icon: MetaAI, label: 'Meta AI' },
  { keywords: ['yi', '零一万物', '01.ai'], icon: Yi, label: 'Yi' },
  { keywords: ['minimax', 'minimax'], icon: Minimax, label: 'Minimax' },
  { keywords: ['spark', '讯飞', '星火'], icon: Spark, label: '讯飞星火' },
  { keywords: ['sensenova', '商汤'], icon: SenseNova, label: '商汤' },
  { keywords: ['stepfun', '阶跃'], icon: Stepfun, label: '阶跃星辰' },
  { keywords: ['skywork', '天工'], icon: Skywork, label: '天工' },
  { keywords: ['hunyuan', '混元', '腾讯'], icon: Hunyuan, label: '混元' },
  { keywords: ['doubao', '豆包'], icon: Doubao, label: '豆包' },
  { keywords: ['ai21', 'ai21labs'], icon: Ai21, label: 'AI21 Labs' },
  { keywords: ['aya', 'cohere'], icon: Aya, label: 'Cohere' },
];

const DEFAULT_ICON = ApiOutlined;
const DEFAULT_LABEL = 'API';

/**
 * 根据提供商名称获取对应的图标组件
 * @param providerName 提供商名称或标识
 * @returns 图标组件和显示标签
 */
export function getProviderIcon(
  providerName: string,
): { icon: React.ComponentType<Record<string, unknown>>; label: string } {
  if (!providerName) {
    return { icon: DEFAULT_ICON, label: DEFAULT_LABEL };
  }

  const lowerName = providerName.toLowerCase().trim();

  for (const mapping of PROVIDER_ICON_MAP) {
    if (mapping.keywords.some((keyword) => lowerName.includes(keyword))) {
      return { icon: mapping.icon, label: mapping.label };
    }
  }

  return { icon: DEFAULT_ICON, label: providerName };
}

/**
 * 获取所有支持的提供商选项（用于下拉选择器）
 */
export function getProviderOptions(): {
  value: string;
  label: string;
  icon: React.ComponentType<Record<string, unknown>>;
}[] {
  return PROVIDER_ICON_MAP.map((mapping) => ({
    value: mapping.label,
    label: mapping.label,
    icon: mapping.icon,
  }));
}
