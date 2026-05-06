/**
 * Generic immutable reorder. Used by both draft fields and published form fields.
 * Returns the original array reference unchanged when the move is a no-op or out of bounds.
 */
export function reorderFields<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] | readonly T[] {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  if (toIndex < 0 || toIndex >= items.length) return items;

  const next = [...items];
  const removed = next.splice(fromIndex, 1);
  if (removed.length !== 1) return items;

  next.splice(toIndex, 0, removed[0] as T);

  return next;
}
