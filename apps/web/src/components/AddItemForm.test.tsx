import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddItemForm } from '@/components/AddItemForm';

describe('AddItemForm', () => {
  it('wysyła nazwę, ilość i domyślną jednostkę', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <AddItemForm
        products={[{ id: 1, name: 'mleko' }]}
        units={['szt', 'l']}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByTestId('item-name'), 'mleko');
    await user.clear(screen.getByTestId('item-quantity'));
    await user.type(screen.getByTestId('item-quantity'), '2');
    await user.click(screen.getByTestId('add-item-submit'));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'mleko', quantity: 2, unit: 'szt', image: null });
  });

  it('wybiera produkt z listy i dołącza zdjęcie', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const file = new File(['png'], 'mleko.png', { type: 'image/png' });
    render(<AddItemForm products={[{ id: 1, name: 'mleko' }, { id: 2, name: 'ser' }]} units={['szt']} onSubmit={onSubmit} />);
    await user.type(screen.getByTestId('item-name'), 'mle');
    await user.click(await screen.findByText('mleko'));
    await user.upload(screen.getByTestId('item-image'), file);
    await user.click(screen.getByTestId('add-item-submit'));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'mleko', quantity: 1, unit: 'szt', image: file });
  });

  it('pozwala dodać nazwę spoza katalogu', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddItemForm products={[{ id: 1, name: 'mleko' }]} units={['szt']} onSubmit={onSubmit} />);
    await user.type(screen.getByTestId('item-name'), 'tofu');
    await user.click(await screen.findByText('Dodaj „tofu”'));
    await user.click(screen.getByTestId('add-item-submit'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'tofu' }));
  });

  it('nie wysyła pustej nazwy', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddItemForm products={[]} units={['szt']} onSubmit={onSubmit} />);
    await user.click(screen.getByTestId('add-item-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('item-form-error')).toBeInTheDocument();
  });
});
