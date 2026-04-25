import { memo, ReactNode } from 'react';

export interface NeuralNetworkLoadingProps {
  children?: ReactNode;
}

const NeuralNetworkLoading = memo<NeuralNetworkLoadingProps>(({ children }) => {
  return <div>{children}</div>;
});

NeuralNetworkLoading.displayName = 'NeuralNetworkLoading';

export default NeuralNetworkLoading;
