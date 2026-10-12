export type ListAccess = {
  ownerId: string;
  sharedUserIds: readonly string[];
};

export function canEditItems(userId: string, list: ListAccess): boolean {
  return list.ownerId === userId;
}

export function canToggleStatus(userId: string, list: ListAccess): boolean {
  return list.ownerId === userId || list.sharedUserIds.includes(userId);
}

export function canViewList(userId: string, list: ListAccess): boolean {
  return canToggleStatus(userId, list);
}
