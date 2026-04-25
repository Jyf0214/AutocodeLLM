import { memo, ReactNode } from 'react';

export interface LibIconProps {
  children?: ReactNode;
}

const LibIcon = memo<LibIconProps>(({ children }) => {
  return <div>{children}</div>;
});

LibIcon.displayName = 'LibIcon';

export default LibIcon;
