import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShareDialog } from '@/components/ShareDialog';

describe('ShareDialog', () => {
  it('udostępnia listę i odbiera dostęp', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn(async () => undefined);
    const onUnshare = vi.fn(async () => undefined);
    render(
      <ShareDialog
        shares={[{ userId: '2', email: 'ania@example.com', displayName: 'Ania' }]}
        pending={false}
        onShare={onShare}
        onUnshare={onUnshare}
      />,
    );
    await user.click(screen.getByTestId('share-button'));
    await user.type(screen.getByTestId('share-email'), 'ania@example.com');
    await user.click(screen.getByTestId('share-submit'));
    expect(onShare).toHaveBeenCalledWith('ania@example.com');
    await user.click(screen.getByTestId('unshare-user'));
    expect(onUnshare).toHaveBeenCalledWith('2');
  });

  it('zostawia adres, gdy udostępnienie się nie uda', async () => {
    const user = userEvent.setup();
    render(
      <ShareDialog
        shares={[]}
        pending={false}
        onShare={async () => {
          throw new Error('zajęte');
        }}
        onUnshare={async () => undefined}
      />,
    );
    await user.click(screen.getByTestId('share-button'));
    expect(screen.getByText('Nikt jeszcze nie ma dostępu.')).toBeInTheDocument();
    await user.type(screen.getByTestId('share-email'), 'ania@example.com');
    await user.click(screen.getByTestId('share-submit'));
    expect(screen.getByTestId('share-email')).toHaveValue('ania@example.com');
  });
});
