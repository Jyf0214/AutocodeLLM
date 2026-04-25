import { memo } from 'react';

export interface EmojiPickerProps {
  onChange?: (emoji: string) => void;
  shape?: 'square' | 'round';
}

// 临时EmojiPicker实现
const EmojiPicker = memo<EmojiPickerProps>(({ shape = 'square', onChange }) => {
  return <div>Emoji Picker Placeholder</div>;
});

EmojiPicker.displayName = 'EmojiPicker';

export default EmojiPicker;
