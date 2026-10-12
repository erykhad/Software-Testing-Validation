import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatQuantity } from '@/lib/utils';
import type { ShoppingItem } from '@/lib/types';

export function ItemRow({
  item,
  canEdit,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: ShoppingItem;
  canEdit: boolean;
  onToggle: (isPurchased: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li data-testid="item-row" className="flex items-center gap-3 py-3">
      <Checkbox
        data-testid="item-checkbox"
        checked={item.isPurchased}
        onCheckedChange={(checked) => onToggle(checked === true)}
        aria-label={`Oznacz ${item.name} jako kupione`}
      />
      {item.hasImage ? (
        <img
          src={`/api/items/${item.id}/image`}
          alt=""
          className="size-12 rounded-md border object-cover"
          data-testid="item-photo"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p
          data-testid="item-label"
          className={item.isPurchased ? 'truncate font-medium text-muted-foreground line-through' : 'truncate font-medium'}
        >
          {item.name}
        </p>
        <p className="text-sm text-muted-foreground" data-testid="item-amount">
          {formatQuantity(item.quantity)} {item.unit}
        </p>
      </div>
      {canEdit ? (
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" data-testid="item-edit" onClick={onEdit} aria-label={`Edytuj ${item.name}`}>
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-testid="item-delete"
            onClick={onDelete}
            aria-label={`Usuń ${item.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : null}
    </li>
  );
}
