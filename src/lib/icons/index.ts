// 图标库兼容层 - 替代 @lobehub/icons
import { ReactNode } from 'react';

export interface IconComponentProps {
  className?: string;
  style?: any;
  size?: number;
}

// 导出占位符图标组件
const createIconComponent = (name: string) => {
  const IconComponent = (props: IconComponentProps) => (
    <span className={props.className} style={props.style} title={name}>
      {name}
    </span>
  );
  IconComponent.displayName = name;
  return IconComponent;
};

// 常用图标导出
export const ModelIcon = createIconComponent('ModelIcon');
export const Azure = createIconComponent('Azure');
export const OpenAI = createIconComponent('OpenAI');
export const IconAvatar = createIconComponent('IconAvatar');

// 其他可能需要的图标
export const GoogleIcon = createIconComponent('GoogleIcon');
export const BedrockIcon = createIconComponent('BedrockIcon');
export const CliaudeIcon = createIconComponent('CliaudeIcon');
export const OllamaIcon = createIconComponent('OllamaIcon');
export const PerplexityIcon = createIconComponent('PerplexityIcon');
export const TogetherAIIcon = createIconComponent('TogetherAIIcon');
export const GrokIcon = createIconComponent('GrokIcon');
export const DeepSeekIcon = createIconComponent('DeepSeekIcon');
export const HuggingFaceIcon = createIconComponent('HuggingFaceIcon');
export const QwenIcon = createIconComponent('QwenIcon');
export const DifyIcon = createIconComponent('DifyIcon');
export const MoonshotIcon = createIconComponent('MoonshotIcon');
export const StepfunIcon = createIconComponent('StepfunIcon');
export const MiniMaxIcon = createIconComponent('MiniMaxIcon');
export const BaiduIcon = createIconComponent('BaiduIcon');
export const TengxunIcon = createIconComponent('TengxunIcon');
export const BytedanceIcon = createIconComponent('BytedanceIcon');
export const XAIIcon = createIconComponent('XAIIcon');

export default {
  ModelIcon,
  Azure,
  OpenAI,
  IconAvatar,
};
