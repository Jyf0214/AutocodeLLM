import { CSSProperties, memo, ReactNode } from 'react';

export interface GalleyGridProps {
  children?: ReactNode;
  columns?: number;
  gap?: number;
  style?: CSSProperties;
}

const GalleyGrid = memo<GalleyGridProps>(({ children, columns = 3, gap = 16, style }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
});

GalleyGrid.displayName = 'GalleyGrid';

export default GalleyGrid;
