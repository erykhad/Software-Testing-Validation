import { describe, expect, it } from 'vitest';
import { canEditItems, canToggleStatus, canViewList, type ListAccess } from './permissions.js';

const list: ListAccess = { ownerId: 'owner', sharedUserIds: ['guest'] };

describe('uprawnienia listy', () => {
  it('właściciel może edytować pozycje i zmieniać status', () => {
    expect(canEditItems('owner', list)).toBe(true);
    expect(canToggleStatus('owner', list)).toBe(true);
    expect(canViewList('owner', list)).toBe(true);
  });

  it('użytkownik ze współdzielenia zmienia tylko status', () => {
    expect(canEditItems('guest', list)).toBe(false);
    expect(canToggleStatus('guest', list)).toBe(true);
    expect(canViewList('guest', list)).toBe(true);
  });

  it('obca osoba nie ma dostępu', () => {
    expect(canEditItems('other', list)).toBe(false);
    expect(canToggleStatus('other', list)).toBe(false);
    expect(canViewList('other', list)).toBe(false);
  });
});
