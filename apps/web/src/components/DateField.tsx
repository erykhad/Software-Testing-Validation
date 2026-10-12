import { format, parse } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function formatPlannedDate(value: string | null) {
  if (!value) return 'Bez daty';
  const date = parse(value, 'yyyy-MM-dd', new Date());
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'd MMMM yyyy', { locale: pl });
}

export function DateField({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const selected = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;

  return (
    <div className="flex gap-2">
      <Input id={id} data-testid="list-date" type="date" value={value} onChange={(event) => onChange(event.target.value)} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon" data-testid="list-date-trigger" aria-label="Otwórz kalendarz">
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(date ? format(date, 'yyyy-MM-dd') : '');
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
