import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { newCharacter, type Character } from '../model/character';
import type { StorageAdapter, StorageChange, StorageIndex } from '../storage/adapter';
import { CharacterProvider, type CharacterContextValue } from './CharacterProvider';
import { useCharacter, useRoster, useToast } from './useCharacter';

function fakeAdapter(seed: Character[] = [], indexOverride?: StorageIndex) {
  const chars = new Map(seed.map((c) => [c.id, c]));
  let index: StorageIndex = indexOverride ?? {
    activeId: seed[0]?.id ?? null,
    characters: seed.map((c) => ({ id: c.id, name: c.info.name, updatedAt: c.updatedAt })),
  };
  const listeners = new Set<(c: StorageChange) => void>();
  const adapter: StorageAdapter = {
    loadIndex: () => index,
    saveIndex: (i) => {
      index = i;
    },
    loadCharacter: (id) => chars.get(id) ?? null,
    saveCharacter: (c) => {
      chars.set(c.id, c);
    },
    deleteCharacter: (id) => {
      chars.delete(id);
    },
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
  const emit = (change: StorageChange) => listeners.forEach((l) => l(change));
  return {
    adapter,
    chars,
    get index() {
      return index;
    },
    /** Another tab wrote the index without us having processed an event yet. */
    setIndexSilently(i: StorageIndex) {
      index = i;
    },
    /** Simulate another tab writing a character. */
    emitExternal(c: Character) {
      chars.set(c.id, c);
      emit({ type: 'character', id: c.id });
    },
    /** Simulate another tab deleting a character. */
    emitDelete(id: string) {
      chars.delete(id);
      index = { ...index, characters: index.characters.filter((s) => s.id !== id) };
      emit({ type: 'character', id });
      emit({ type: 'index' });
    },
  };
}

const ctx: { current: CharacterContextValue | null } = { current: null };

function Probe() {
  const { character, dispatch, saveState } = useCharacter();
  const roster = useRoster();
  const toasts = useToast();
  ctx.current = { ...roster, ...toasts, character, dispatch, saveState, undoHp: null };
  return (
    <div>
      <span data-testid="name">{character.info.name}</span>
      <span data-testid="save">{saveState}</span>
      <span data-testid="active">{roster.activeId}</span>
      <span data-testid="count">{roster.summaries.length}</span>
      <ul data-testid="toasts">
        {toasts.toasts.map((t) => (
          <li key={t.id}>{t.message}</li>
        ))}
      </ul>
      <button onClick={() => dispatch({ type: 'patch', patch: { info: { name: 'Renamed' } } })}>rename</button>
      <button onClick={() => roster.create('Second')}>create</button>
      <button onClick={() => roster.remove(roster.activeId!)}>remove</button>
    </div>
  );
}

function setup(seed?: Character[], indexOverride?: StorageIndex) {
  const fake = fakeAdapter(seed, indexOverride);
  render(
    <CharacterProvider adapter={fake.adapter}>
      <Probe />
    </CharacterProvider>,
  );
  return fake;
}

const flushTimers = () => act(() => vi.advanceTimersByTimeAsync(350));

describe('CharacterProvider', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('creates a first character when storage is empty', () => {
    const fake = setup();
    expect(screen.getByTestId('name')).toHaveTextContent('New character');
    expect(fake.index.characters).toHaveLength(1);
  });

  it('persists edits after the debounce and reports saved', async () => {
    const seed = newCharacter('Thalia');
    const fake = setup([seed]);
    await userEvent.click(screen.getByText('rename'));
    expect(screen.getByTestId('save')).toHaveTextContent('saving');
    expect(fake.chars.get(seed.id)?.info.name).toBe('Thalia');
    await flushTimers();
    expect(fake.chars.get(seed.id)?.info.name).toBe('Renamed');
    expect(fake.index.characters[0]?.name).toBe('Renamed');
    expect(screen.getByTestId('save')).toHaveTextContent('saved');
  });

  it('adopts external change when idle', async () => {
    const seed = newCharacter('Thalia');
    const fake = setup([seed]);
    await act(async () => {
      fake.emitExternal({ ...seed, info: { ...seed.info, name: 'From other tab' } });
    });
    expect(screen.getByTestId('name')).toHaveTextContent('From other tab');
  });

  it('keeps local pending edit', async () => {
    const seed = newCharacter('Thalia');
    const fake = setup([seed]);
    await userEvent.click(screen.getByText('rename'));
    await act(async () => {
      fake.emitExternal({ ...seed, info: { ...seed.info, name: 'From other tab' } });
    });
    expect(screen.getByTestId('name')).toHaveTextContent('Renamed');
    expect(screen.getByTestId('toasts')).toHaveTextContent(
      'Another tab changed this character; your edit was kept',
    );
    await flushTimers();
    expect(fake.chars.get(seed.id)?.info.name).toBe('Renamed');
  });

  it('dedupes identical toasts', async () => {
    const seed = newCharacter('Thalia');
    const fake = setup([seed]);
    await userEvent.click(screen.getByText('rename'));
    await act(async () => {
      fake.emitExternal({ ...seed, info: { ...seed.info, name: 'A' } });
      fake.emitExternal({ ...seed, info: { ...seed.info, name: 'B' } });
      fake.emitExternal({ ...seed, info: { ...seed.info, name: 'C' } });
    });
    expect(screen.getByTestId('toasts').querySelectorAll('li')).toHaveLength(1);
  });

  it('warns when another tab deleted the open character and keeps the local copy', async () => {
    const a = newCharacter('A');
    const b = newCharacter('B');
    const fake = setup([a, b]);
    await act(async () => {
      fake.emitDelete(a.id);
    });
    expect(screen.getByTestId('toasts')).toHaveTextContent('deleted in another tab');
    expect(screen.getByTestId('name')).toHaveTextContent('A');
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(fake.chars.has(a.id)).toBe(true);
  });

  it('merges the stored index on commit instead of overwriting other tabs', async () => {
    const seed = newCharacter('Thalia');
    const fake = setup([seed]);
    fake.setIndexSilently({
      activeId: 'other',
      characters: [...fake.index.characters, { id: 'other', name: 'Other', updatedAt: 't' }],
    });
    await userEvent.click(screen.getByText('create'));
    const ids = fake.index.characters.map((s) => s.id);
    expect(ids).toContain(seed.id);
    expect(ids).toContain('other');
    expect(ids).toHaveLength(3);
    expect(fake.index.activeId).toBe(screen.getByTestId('active').textContent);
  });

  it('keeps unreadable index entries so a future fix can recover them', () => {
    const seed = newCharacter('Thalia');
    const fake = setup([seed], {
      activeId: 'ghost',
      characters: [
        { id: 'ghost', name: 'Ghost', updatedAt: 't' },
        { id: seed.id, name: 'Thalia', updatedAt: 't' },
      ],
    });
    expect(screen.getByTestId('name')).toHaveTextContent('Thalia');
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(fake.index.characters.map((s) => s.id)).toContain('ghost');
  });

  it('reports a failed save once and keeps the edit pending', async () => {
    const seed = newCharacter('Thalia');
    const fake = setup([seed]);
    fake.adapter.saveCharacter = () => {
      throw new Error('QuotaExceededError');
    };
    await userEvent.click(screen.getByText('rename'));
    await flushTimers();
    expect(screen.getByTestId('save')).toHaveTextContent('saving');
    expect(screen.getByTestId('toasts')).toHaveTextContent('Could not save');
    await userEvent.click(screen.getByText('rename'));
    await flushTimers();
    expect(screen.getByTestId('toasts').querySelectorAll('li')).toHaveLength(1);
  });

  it('select flushes pending edits of the previous character', async () => {
    const a = newCharacter('A');
    const b = newCharacter('B');
    const fake = setup([a, b]);
    await userEvent.click(screen.getByText('rename'));
    await act(async () => ctx.current!.select(b.id));
    expect(screen.getByTestId('name')).toHaveTextContent('B');
    expect(fake.chars.get(a.id)?.info.name).toBe('Renamed');
    expect(fake.index.activeId).toBe(b.id);
  });

  it('duplicate copies the active character under a new id', async () => {
    const a = newCharacter('A');
    const fake = setup([a]);
    await act(async () => ctx.current!.duplicate(a.id));
    expect(screen.getByTestId('name')).toHaveTextContent('A (copy)');
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('active').textContent).not.toBe(a.id);
    expect(fake.chars.get(a.id)?.info.name).toBe('A');
  });

  it('duplicate works without structuredClone (iOS 10)', async () => {
    vi.stubGlobal('structuredClone', undefined);
    try {
      const a = newCharacter('A');
      setup([a]);
      await act(async () => ctx.current!.duplicate(a.id));
      expect(screen.getByTestId('name')).toHaveTextContent('A (copy)');
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('rename of a non-active character updates storage and the summary', async () => {
    const a = newCharacter('A');
    const b = newCharacter('B');
    const fake = setup([a, b]);
    await act(async () => ctx.current!.rename(b.id, 'Bee'));
    expect(fake.chars.get(b.id)?.info.name).toBe('Bee');
    expect(fake.index.characters.find((s) => s.id === b.id)?.name).toBe('Bee');
    expect(screen.getByTestId('name')).toHaveTextContent('A');
  });

  it('importJson adds characters with fresh ids or replaces by id', async () => {
    const seed = newCharacter('Thalia');
    const fake = setup([seed]);
    const incoming = { ...seed, info: { ...seed.info, name: 'Imported' } };
    const json = JSON.stringify({ app: 'dnd-sheet', version: 1, characters: [incoming] });
    await act(async () => {
      ctx.current!.importJson(json, 'add');
    });
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('name')).toHaveTextContent('Imported');
    expect(fake.chars.get(seed.id)?.info.name).toBe('Thalia');
    await act(async () => {
      ctx.current!.importJson(json, 'replace');
    });
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(fake.chars.get(seed.id)?.info.name).toBe('Imported');
  });

  it('importJson reports skipped entries', async () => {
    setup([newCharacter('Thalia')]);
    const good = newCharacter('Good');
    const json = JSON.stringify({ app: 'dnd-sheet', version: 1, characters: [{ junk: true }, good] });
    let result: ReturnType<CharacterContextValue['importJson']> | undefined;
    await act(async () => {
      result = ctx.current!.importJson(json, 'add');
    });
    expect(result).toEqual({ ok: true, count: 1, skipped: 1 });
  });

  it('a wrong-typed import renders cleanly', async () => {
    const seed = newCharacter('Thalia');
    setup([seed]);
    const bad = JSON.parse(JSON.stringify(newCharacter('Bad')));
    bad.info.name = null;
    bad.abilities.dex = 'abc';
    bad.weapons = [{}];
    let ok = false;
    await act(async () => {
      ok = ctx.current!.importJson(JSON.stringify(bad), 'add').ok;
    });
    expect(ok).toBe(true);
    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });

  it('create adds a summary and selects it', async () => {
    const fake = setup([newCharacter('Thalia')]);
    await userEvent.click(screen.getByText('create'));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('name')).toHaveTextContent('Second');
    expect(fake.index.activeId).toBe(screen.getByTestId('active').textContent);
  });

  it('remove selects the next character, or creates a fresh one when none remain', async () => {
    const a = newCharacter('A');
    const b = newCharacter('B');
    const fake = setup([a, b]);
    await userEvent.click(screen.getByText('remove'));
    expect(screen.getByTestId('name')).toHaveTextContent('B');
    expect(fake.chars.has(a.id)).toBe(false);
    await userEvent.click(screen.getByText('remove'));
    expect(screen.getByTestId('name')).toHaveTextContent('New character');
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
