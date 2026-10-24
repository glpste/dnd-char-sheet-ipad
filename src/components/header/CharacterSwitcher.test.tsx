import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterSwitcher } from './CharacterSwitcher';

const roster = () => ({
  summaries: [
    { id: 'a', name: 'Thalia', updatedAt: 't' },
    { id: 'b', name: 'Borin', updatedAt: 't' },
  ],
  activeId: 'a',
  create: vi.fn(),
  duplicate: vi.fn(),
  rename: vi.fn(),
  remove: vi.fn(),
  select: vi.fn(),
});

describe('CharacterSwitcher', () => {
  it('lists characters and selects one', async () => {
    const r = roster();
    render(<CharacterSwitcher {...r} />);
    await userEvent.click(screen.getByRole('button', { name: /Thalia/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Borin' }));
    expect(r.select).toHaveBeenCalledWith('b');
  });

  it('creates a new character', async () => {
    const r = roster();
    render(<CharacterSwitcher {...r} />);
    await userEvent.click(screen.getByRole('button', { name: /Thalia/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'New character' }));
    expect(r.create).toHaveBeenCalled();
  });

  it('only deletes after confirmation', async () => {
    const r = roster();
    render(<CharacterSwitcher {...r} />);
    await userEvent.click(screen.getByRole('button', { name: /Thalia/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete Thalia' }));
    expect(r.remove).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(r.remove).toHaveBeenCalledWith('a');
  });
});

describe('CharacterSwitcher on iOS 10', () => {
  it('closes when a touch starts outside the menu', async () => {
    render(<CharacterSwitcher {...roster()} />);
    await userEvent.click(screen.getByRole('button', { name: /Thalia/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.touchStart(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
