import { memo, ReactNode } from 'react';

export interface TipGuideProps {
  children?: ReactNode;
}

const TipGuide = memo<TipGuideProps>(({ children }) => {
  return <div>{children}</div>;
});

TipGuide.displayName = 'TipGuide';

export default TipGuide;
