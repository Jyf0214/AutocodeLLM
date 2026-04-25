import { memo, ReactNode } from 'react';

export interface ImageItemProps {
  children?: ReactNode;
}

const ImageItem = memo<ImageItemProps>(({ children }) => {
  return <div>{children}</div>;
});

ImageItem.displayName = 'ImageItem';

export default ImageItem;
