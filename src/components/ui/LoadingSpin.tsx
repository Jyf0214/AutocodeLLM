import { Spin, SpinProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export interface LoadingSpinProps extends SpinProps {
  text?: string;
}

export const LoadingSpin = ({
  size = 'large',
  tip,
  text,
  ...props
}: LoadingSpinProps) => {
  return (
    <Spin
      size={size}
      indicator={<LoadingOutlined spin />}
      tip={tip || text}
      {...props}
    />
  );
};

export const CenterSpin = ({ text, ...props }: LoadingSpinProps) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <LoadingSpin text={text} {...props} />
  </div>
);

export const InlineSpin = ({ size = 'small', ...props }: SpinProps) => (
  <Spin size={size} indicator={<LoadingOutlined spin />} {...props} />
);

export const FullPageSpin = ({ text = '加载中...', ...props }: LoadingSpinProps) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 9999,
    }}
  >
    <LoadingSpin size="large" text={text} {...props} />
  </div>
);