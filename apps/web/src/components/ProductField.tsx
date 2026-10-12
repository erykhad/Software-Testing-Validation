import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import type { PopularProduct } from '@/lib/types';

export function ProductField({
  value,
  onChange,
  products,
}: {
  value: string;
  onChange: (value: string) => void;
  products: PopularProduct[];
}) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const matches = products.filter((product) => product.name.toLowerCase().includes(query));
  const exact = products.some((product) => product.name.toLowerCase() === query);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          id="product-name"
          data-testid="item-name"
          value={value}
          placeholder="np. mleko"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {matches.length === 0 && !value.trim() ? <CommandEmpty>Wpisz nazwę produktu</CommandEmpty> : null}
            <CommandGroup heading="Popularne">
              {matches.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onChange(product.name);
                    setOpen(false);
                  }}
                >
                  {product.name}
                </CommandItem>
              ))}
            </CommandGroup>
            {value.trim() && !exact ? (
              <CommandGroup>
                <CommandItem
                  value={value.trim()}
                  onSelect={() => {
                    onChange(value.trim());
                    setOpen(false);
                  }}
                >
                  Dodaj „{value.trim()}”
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
