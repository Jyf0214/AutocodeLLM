import { memo, ReactNode } from 'react';

export interface InfoTooltipProps {
  children?: ReactNode;
  title?: string;
}

const InfoTooltip = memo<InfoTooltipProps>(({ children, title }) => {
  return <div title={title}>{children}</div>;
});

InfoTooltip.displayName = 'InfoTooltip';

export default InfoTooltip;
