import { memo, useMemo } from 'react';

export interface FileIconProps {
  file?: string;
  size?: number;
}

const FileIcon = memo<FileIconProps>(({ file = '', size = 24 }) => {
  const fileExt = useMemo(() => {
    const match = file.match(/\.(\w+)$/);
    return match ? match[1].toLowerCase() : 'file';
  }, [file]);

  return <div style={{ width: size, height: size }}>📄</div>;
});

FileIcon.displayName = 'FileIcon';

export default FileIcon;
