'use client';

import type React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableFieldRowProps {
  fieldId: string;
  children: (params: {
    isDragging: boolean;
    dragHandleProps: React.HTMLAttributes<HTMLElement>;
    dragAttributes: Record<string, unknown>;
  }) => React.ReactNode;
}

export function SortableFieldRow({ fieldId, children }: SortableFieldRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: fieldId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={isDragging ? 'opacity-70' : undefined}>
      {children({
        isDragging,
        dragHandleProps: { ...listeners },
        dragAttributes: { ...attributes },
      })}
    </li>
  );
}
