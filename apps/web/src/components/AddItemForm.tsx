import { useState, type FormEvent } from 'react';
import { ProductField } from '@/components/ProductField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { itemSchema, UNITS } from '@/lib/schemas';
import type { PopularProduct } from '@/lib/types';

export type NewItemInput = {
  name: string;
  quantity: number;
  unit: string;
  image: File | null;
};

export function AddItemForm({
  products,
  units = [...UNITS],
  onSubmit,
  pending = false,
}: {
  products: PopularProduct[];
  units?: readonly string[];
  onSubmit: (input: NewItemInput) => void;
  pending?: boolean;
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState(units[0] ?? 'szt');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = itemSchema.safeParse({ name, quantity, unit });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Uzupełnij pozycję');
      return;
    }
    setError(null);
    onSubmit({ ...parsed.data, image });
  }

  return (
    <form data-testid="add-item-form" onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]">
        <div className="grid gap-2">
          <Label htmlFor="product-name">Produkt</Label>
          <ProductField value={name} onChange={setName} products={products} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="item-quantity">Ilość</Label>
          <Input
            id="item-quantity"
            data-testid="item-quantity"
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Jednostka</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger data-testid="item-unit" aria-label="Jednostka">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="item-image">Zdjęcie referencyjne</Label>
        <Input
          id="item-image"
          data-testid="item-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
        />
      </div>
      {error ? (
        <p data-testid="item-form-error" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" data-testid="add-item-submit" disabled={pending} className="justify-self-start">
        Dodaj pozycję
      </Button>
    </form>
  );
}
