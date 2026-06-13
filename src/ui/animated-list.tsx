'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';

interface AnimatedListProps {
  items: { id: string; content: ReactNode }[];
}

/**
 * 列表布局动画 — 增删时自动过渡
 */
export function AnimatedList({ items }: AnimatedListProps) {
  return (
    <AnimatePresence mode="popLayout">
      {items.map((item) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {item.content}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
