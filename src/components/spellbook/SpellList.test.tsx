import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { newSpell } from '../../model/character';
import { ranger, renderWithCharacter } from '../../test/renderWithCharacter';
import { ToastHost } from '../ui/ToastHost';
import { SpellList } from './SpellList';

function setup() {
  const c = ranger();
  c.spellbook.spells = [
    { ...newSpell(0), name: 'Fire Bolt', prepared: true },
    { ...newSpell(1), name: 'Cure Wounds', prepared: false },
    { ...newSpell(1), name: 'Faerie Fire', prepared: true },
  ];
  return renderWithCharacter(
    <>
      <SpellList />
      <ToastHost />
    </>,
    c,
  );
}

const names = () => screen.getAllByLabelText('Spell name').map((i) => (i as HTMLInputElement).value);

describe('SpellList', () => {
  it('groups spells by level', () => {
    setup();
    expect(within(screen.getByTestId('spell-level-0')).getAllByLabelText('Spell name')).toHaveLength(1);
    expect(within(screen.getByTestId('spell-level-1')).getAllByLabelText('Spell name')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Cantrips' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Level 1' })).toBeInTheDocument();
  });

  it('adds a spell at a chosen level', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Add spell' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Level 2' }));
    expect(within(screen.getByTestId('spell-level-2')).getAllByLabelText('Spell name')).toHaveLength(1);
  });

  it('filters to prepared spells', async () => {
    setup();
    await userEvent.click(screen.getByRole('switch', { name: 'Prepared only' }));
    expect(names()).toEqual(['Fire Bolt', 'Faerie Fire']);
  });

  it('searches by name', async () => {
    setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search spells' }), 'fire');
    expect(names()).toEqual(['Fire Bolt', 'Faerie Fire']);
  });

  it('removes with undo', async () => {
    setup();
    const entry = screen.getByTestId('spell-level-0');
    await userEvent.click(within(entry).getByRole('button', { name: 'Expand Fire Bolt' }));
    await userEvent.click(within(entry).getByRole('button', { name: 'Remove Fire Bolt' }));
    expect(names()).not.toContain('Fire Bolt');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(names()).toContain('Fire Bolt');
  });
});

describe('SpellList on iOS 10', () => {
  it('closes the add-spell menu when a touch starts outside it', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Add spell' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.touchStart(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
