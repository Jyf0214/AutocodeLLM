import { memo, ReactNode } from 'react';

export interface HtmlPreviewProps {
  children?: ReactNode;
}

const HtmlPreview = memo<HtmlPreviewProps>(({ children }) => {
  return <div>{children}</div>;
});

HtmlPreview.displayName = 'HtmlPreview';

export default HtmlPreview;
