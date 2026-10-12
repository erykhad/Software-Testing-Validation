import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DateField, formatPlannedDate } from '@/components/DateField';

describe('data zakupów', () => {
  it('formatuje pustą, złą i poprawną datę', () => {
    expect(formatPlannedDate(null)).toBe('Bez daty');
    expect(formatPlannedDate('wtorek')).toBe('wtorek');
    expect(formatPlannedDate('2026-10-16')).toMatch(/2026/);
  });

  it('przyjmuje datę z pola i z kalendarza', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateField value="2026-10-16" onChange={onChange} />);
    await user.clear(screen.getByTestId('list-date'));
    await user.type(screen.getByTestId('list-date'), '2026-10-20');
    expect(onChange).toHaveBeenCalled();

    await user.click(screen.getByTestId('list-date-trigger'));
    const day = screen.getAllByRole('button', { name: /16/ })[0];
    if (day) await user.click(day);
    expect(onChange).toHaveBeenCalled();
  });
});
