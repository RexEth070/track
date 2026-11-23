'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ className = '', children, delay = 2000 }: AnimatedListProps) => {
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    );

    const [index, setIndex] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setIndex((prevIndex) => prevIndex + 1);
      }, delay);

      return () => clearInterval(interval);
    }, [delay]);

    const itemsToShow = useMemo(() => {
      // Show exactly the latest 2 items so height is perfectly compact
      const result: React.ReactElement[] = [];
      for (let i = index; i >= 0 && result.length < 2; i--) {
        const item = childrenArray[i % childrenArray.length];
        if (React.isValidElement(item)) {
          result.push(
            React.cloneElement(item, { key: `item-${i}` } as React.Attributes)
          );
        }
      }
      return result;
    }, [index, childrenArray]);

    return (
      <div className={`flex flex-col items-center gap-2 w-full ${className}`}>
        <AnimatePresence initial={false}>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={item.key as string}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedList.displayName = 'AnimatedList';

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations = {
    initial: { scale: 0.88, opacity: 0, y: -12 },
    animate: { scale: 1, opacity: 1, y: 0, originY: 0 },
    exit: { scale: 0.88, opacity: 0, y: 12 },
    transition: { type: 'spring' as const, stiffness: 350, damping: 25 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}
