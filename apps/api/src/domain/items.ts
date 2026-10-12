export function sortItems<T extends { position: number; createdAt: string }>(items: readonly T[]): T[] {
  return [...items].sort(
    (left, right) => left.position - right.position || left.createdAt.localeCompare(right.createdAt),
  );
}

export function summarizeList(items: readonly { isPurchased: boolean }[]) {
  const purchased = items.filter((item) => item.isPurchased).length;
  return {
    total: items.length,
    purchased,
    remaining: items.length - purchased,
  };
}
