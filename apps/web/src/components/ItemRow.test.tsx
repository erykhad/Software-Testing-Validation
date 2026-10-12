import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ItemRow } from '@/components/ItemRow';
import type { ShoppingItem } from '@/lib/types';

const item: ShoppingItem = {
  id: '1',
  listId: 'list',
  name: 'mleko',
  quantity: 2,
  unit: 'l',
  isPurchased: false,
  hasImage: false,
  position: 1,
  createdAt: '2026-10-12T00:00:00.000Z',
};

describe('ItemRow', () => {
  it('przekreśla kupioną pozycję', () => {
    render(
      <ItemRow item={{ ...item, isPurchased: true }} canEdit onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByTestId('item-label')).toHaveClass('line-through');
  });

  it('ukrywa edycję, gdy użytkownik ma tylko odczyt statusu', () => {
    render(<ItemRow item={item} canEdit={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByTestId('item-delete')).not.toBeInTheDocument();
    expect(screen.queryByTestId('item-edit')).not.toBeInTheDocument();
  });

  it('zgłasza zmianę statusu', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ItemRow item={item} canEdit onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />);
    await user.click(screen.getByTestId('item-checkbox'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});
