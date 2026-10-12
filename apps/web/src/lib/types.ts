export type User = {
  id: string;
  email: string;
  displayName: string;
};

export type ShoppingListSummary = {
  id: string;
  ownerId: string;
  name: string;
  plannedDate: string | null;
  createdAt: string;
  updatedAt: string;
  role: 'owner' | 'shared';
  itemCount: number;
  purchasedCount: number;
};

export type ShoppingItem = {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  hasImage: boolean;
  position: number;
  createdAt: string;
};

export type Share = {
  userId: string;
  email: string;
  displayName: string;
};

export type ShoppingList = ShoppingListSummary & {
  items: ShoppingItem[];
  shares: Share[];
};

export type PopularProduct = {
  id: number;
  name: string;
};
