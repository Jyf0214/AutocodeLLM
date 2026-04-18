import { Button, ButtonProps } from 'antd';
import { forwardRef } from 'react';

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        loading={loading}
        disabled={disabled || loading}
        {...props}
      >
        {loadingText && loading ? loadingText : children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';