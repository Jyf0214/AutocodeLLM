'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界组件 - 捕获子组件树中的 JavaScript 错误
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误日志到控制台
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // 在生产环境中记录错误到控制台
    if (process.env.NODE_ENV === 'production') {
      // 错误追踪服务已禁用，错误信息已通过 console.error 记录
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-layout)',
            padding: 24,
          }}
        >
          <Result
            status="error"
            title="页面加载失败"
            subTitle={
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <p style={{ marginBottom: 8 }}>抱歉，页面在加载过程中遇到了错误。</p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <pre
                    style={{
                      background: 'var(--color-fill-quaternary)',
                      padding: 16,
                      borderRadius: 8,
                      fontSize: 12,
                      overflow: 'auto',
                      maxHeight: 200,
                      textAlign: 'left',
                    }}
                  >
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            }
            extra={[
              <Button key="reload" type="primary" onClick={this.handleReload}>
                重新加载
              </Button>,
              <Button key="reset" onClick={this.handleReset}>
                返回页面
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
