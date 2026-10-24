import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { newCharacter, newId, type Character } from '../model/character';
import type { CharacterSummary, StorageAdapter, StorageIndex } from '../storage/adapter';
import { characterReducer, type Action } from './characterReducer';
import { parseImport, serialize } from './exportImport';

export const SAVE_DEBOUNCE_MS = 300;
export const TOAST_MS = 5000;
export const OTHER_TAB_MESSAGE = 'Another tab changed this character; your edit was kept';
export const OTHER_TAB_DELETED_MESSAGE = 'This character was deleted in another tab; your copy was kept';
export const SAVE_FAILED_MESSAGE = 'Could not save to this browser’s storage. Export your characters before closing the tab.';

export type SaveState = 'saved' | 'saving';

export interface Toast {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export type ImportResult = { ok: true; count: number; skipped: number } | { ok: false; error: string };

type HpSnapshot = { current: number; temp: number };

export interface CharacterContextValue {
  character: Character;
  dispatch: (action: Action) => void;
  saveState: SaveState;
  undoHp: (() => void) | null;
  summaries: CharacterSummary[];
  activeId: string;
  create: (name?: string) => void;
  duplicate: (id: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  select: (id: string) => void;
  exportAll: () => string;
  exportOne: (id: string) => string;
  importJson: (json: string, mode: 'add' | 'replace') => ImportResult;
  toasts: Toast[];
  /** Returns the toast id; an identical visible message is reused instead of duplicated. */
  pushToast: (message: string, action?: Toast['action']) => string;
  dismissToast: (id: string) => void;
}

export const CharacterContext = createContext<CharacterContextValue | null>(null);

function summaryOf(c: Character): CharacterSummary {
  return { id: c.id, name: c.info.name, updatedAt: c.updatedAt };
}

function upsertSummary(index: StorageIndex, c: Character, activeId: string = index.activeId ?? c.id): StorageIndex {
  const s = summaryOf(c);
  const exists = index.characters.some((x) => x.id === c.id);
  return {
    activeId,
    characters: exists ? index.characters.map((x) => (x.id === c.id ? s : x)) : [...index.characters, s],
  };
}

/** Union of two summary lists; `ours` wins for ids present in both, order follows `ours` then new ones from `theirs`. */
function mergeSummaries(ours: CharacterSummary[], theirs: CharacterSummary[]): CharacterSummary[] {
  const seen = new Set(ours.map((s) => s.id));
  return [...ours, ...theirs.filter((s) => !seen.has(s.id))];
}

interface Loaded {
  index: StorageIndex;
  character: Character;
}

/**
 * Pick the active character. Index entries whose records cannot be read are kept
 * (so a later migration can still recover them) but are never auto-selected.
 */
function initialLoad(adapter: StorageAdapter): Loaded {
  const stored = adapter.loadIndex();
  const readable = (id: string | null | undefined) => (id ? adapter.loadCharacter(id) : null);
  const existing = readable(stored.activeId) ?? stored.characters.map((s) => readable(s.id)).find((c) => c !== null) ?? null;
  if (existing) {
    const index = { activeId: existing.id, characters: stored.characters };
    if (index.activeId !== stored.activeId) adapter.saveIndex(index);
    return { index, character: existing };
  }
  const fresh = newCharacter();
  adapter.saveCharacter(fresh);
  const index = upsertSummary({ activeId: fresh.id, characters: stored.characters }, fresh, fresh.id);
  adapter.saveIndex(index);
  return { index, character: fresh };
}

export function CharacterProvider({ adapter, children }: { adapter: StorageAdapter; children: ReactNode }) {
  const [loaded] = useState(() => initialLoad(adapter));
  const [character, setCharacter] = useState<Character>(loaded.character);
  const [index, setIndex] = useState<StorageIndex>(loaded.index);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hpBefore, setHpBefore] = useState<HpSnapshot | null>(null);

  // Refs so flush/subscribe callbacks always see the latest values without re-subscribing.
  const characterRef = useRef(character);
  characterRef.current = character;
  const indexRef = useRef(index);
  indexRef.current = index;
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFailedRef = useRef(false);

  const dismissToast = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, action?: Toast['action']): string => {
      const existing = toastsRef.current.find((t) => t.message === message && !t.action && !action);
      if (existing) return existing.id;
      const id = newId();
      const toast = { id, message, action };
      toastsRef.current = [...toastsRef.current, toast];
      setToasts((ts) => [...ts, toast]);
      setTimeout(() => dismissToast(id), TOAST_MS);
      return id;
    },
    [dismissToast],
  );

  /** Write the index, merging in summaries another tab may have added since we last read it. */
  const commitIndex = useCallback(
    (next: StorageIndex) => {
      let stored: StorageIndex | null = null;
      try {
        stored = adapter.loadIndex();
      } catch {
        /* unreadable index: write ours */
      }
      const merged: StorageIndex = stored
        ? { activeId: next.activeId, characters: mergeSummaries(next.characters, stored.characters) }
        : next;
      indexRef.current = merged;
      setIndex(merged);
      adapter.saveIndex(merged);
    },
    [adapter],
  );

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!pendingRef.current) return;
    const c = characterRef.current;
    try {
      adapter.saveCharacter(c);
      commitIndex(upsertSummary(indexRef.current, c));
    } catch (err) {
      // Quota exceeded or storage disabled: keep the edit pending so the next flush retries,
      // and tell the user once so they can export before closing the tab.
      console.error('dnd-sheet: could not save character', err);
      if (!saveFailedRef.current) {
        saveFailedRef.current = true;
        pushToast(SAVE_FAILED_MESSAGE);
      }
      return;
    }
    saveFailedRef.current = false;
    pendingRef.current = false;
    setSaveState('saved');
  }, [adapter, commitIndex, pushToast]);

  const scheduleFlush = useCallback(() => {
    pendingRef.current = true;
    setSaveState('saving');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }, [flush]);

  const dispatch = useCallback(
    (action: Action) => {
      const prev = characterRef.current;
      if (action.type === 'hp') setHpBefore({ current: prev.combat.hp.current, temp: prev.combat.hp.temp });
      const next = characterReducer(prev, action);
      characterRef.current = next;
      setCharacter(next);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const undoHp = useMemo(() => {
    if (!hpBefore) return null;
    return () => {
      const prev = characterRef.current;
      const next = characterReducer(prev, { type: 'patch', patch: { combat: { hp: hpBefore } } });
      characterRef.current = next;
      setCharacter(next);
      setHpBefore(null);
      scheduleFlush();
    };
  }, [hpBefore, scheduleFlush]);

  // Flush on unload so the last keystrokes are never lost.
  useEffect(() => {
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  // Other tabs: adopt their writes when we have nothing pending; otherwise ours win.
  useEffect(() => {
    return adapter.subscribe((change) => {
      if (change.type === 'index') {
        const stored = adapter.loadIndex();
        setIndex((cur) => {
          // Keep our own active id and make sure our open character stays listed.
          const theirs = stored.characters.some((s) => s.id === characterRef.current.id)
            ? stored.characters
            : [...stored.characters, summaryOf(characterRef.current)];
          const next = { activeId: cur.activeId, characters: theirs };
          indexRef.current = next;
          return next;
        });
        return;
      }
      if (change.id !== characterRef.current.id) return;
      const external = adapter.loadCharacter(change.id);
      if (!external) {
        // Deleted elsewhere. Our in-memory copy is the only one left: write it back now and say so.
        pushToast(OTHER_TAB_DELETED_MESSAGE);
        pendingRef.current = true;
        flush();
        return;
      }
      if (pendingRef.current) {
        pushToast(OTHER_TAB_MESSAGE);
        return;
      }
      characterRef.current = external;
      setCharacter(external);
    });
  }, [adapter, flush, pushToast]);

  const activate = useCallback(
    (c: Character, nextIndex: StorageIndex) => {
      characterRef.current = c;
      setCharacter(c);
      setHpBefore(null);
      commitIndex({ ...nextIndex, activeId: c.id });
    },
    [commitIndex],
  );

  const create = useCallback(
    (name?: string) => {
      flush();
      const c = newCharacter(name);
      adapter.saveCharacter(c);
      activate(c, upsertSummary(indexRef.current, c, c.id));
    },
    [activate, adapter, flush],
  );

  const select = useCallback(
    (id: string) => {
      if (id === characterRef.current.id) return;
      flush();
      const c = adapter.loadCharacter(id);
      if (!c) {
        pushToast('That character could not be loaded.');
        return;
      }
      activate(c, indexRef.current);
    },
    [activate, adapter, flush, pushToast],
  );

  const duplicate = useCallback(
    (id: string) => {
      flush();
      const src = id === characterRef.current.id ? characterRef.current : adapter.loadCharacter(id);
      if (!src) return;
      const now = new Date().toISOString();
      const copy: Character = {
        ...(JSON.parse(JSON.stringify(src)) as Character),
        id: newId(),
        createdAt: now,
        updatedAt: now,
        info: { ...src.info, name: `${src.info.name} (copy)` },
      };
      adapter.saveCharacter(copy);
      activate(copy, upsertSummary(indexRef.current, copy, copy.id));
    },
    [activate, adapter, flush],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      if (id === characterRef.current.id) {
        dispatch({ type: 'patch', patch: { info: { name } } });
        return;
      }
      const c = adapter.loadCharacter(id);
      if (!c) return;
      const next = characterReducer(c, { type: 'patch', patch: { info: { name } } });
      adapter.saveCharacter(next);
      commitIndex(upsertSummary(indexRef.current, next));
    },
    [adapter, commitIndex, dispatch],
  );

  /** Like commitIndex, but a summary another tab still lists for the deleted id must not come back. */
  const commitIndexRemoving = useCallback(
    (removedId: string, next: StorageIndex) => {
      let stored: StorageIndex | null = null;
      try {
        stored = adapter.loadIndex();
      } catch {
        /* write ours */
      }
      const theirs = (stored?.characters ?? []).filter((s) => s.id !== removedId);
      const merged = { activeId: next.activeId, characters: mergeSummaries(next.characters, theirs) };
      indexRef.current = merged;
      setIndex(merged);
      adapter.saveIndex(merged);
    },
    [adapter],
  );

  const remove = useCallback(
    (id: string) => {
      const wasActive = id === characterRef.current.id;
      if (wasActive) {
        // Discard pending edits of the character being deleted.
        pendingRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        setSaveState('saved');
      } else {
        flush();
      }
      adapter.deleteCharacter(id);
      const remaining = indexRef.current.characters.filter((s) => s.id !== id);
      if (!wasActive) {
        commitIndexRemoving(id, { ...indexRef.current, characters: remaining });
        return;
      }
      const next = remaining.map((s) => adapter.loadCharacter(s.id)).find((c) => c !== null) ?? null;
      if (next) {
        characterRef.current = next;
        setCharacter(next);
        setHpBefore(null);
        commitIndexRemoving(id, { activeId: next.id, characters: remaining });
      } else {
        const fresh = newCharacter();
        adapter.saveCharacter(fresh);
        characterRef.current = fresh;
        setCharacter(fresh);
        setHpBefore(null);
        commitIndexRemoving(id, upsertSummary({ activeId: fresh.id, characters: remaining }, fresh, fresh.id));
      }
    },
    [adapter, commitIndexRemoving, flush],
  );

  const loadAll = useCallback((): Character[] => {
    flush();
    return indexRef.current.characters
      .map((s) => (s.id === characterRef.current.id ? characterRef.current : adapter.loadCharacter(s.id)))
      .filter((c): c is Character => c !== null);
  }, [adapter, flush]);

  const exportAll = useCallback(() => serialize(loadAll()), [loadAll]);

  const exportOne = useCallback(
    (id: string) => {
      flush();
      const c = id === characterRef.current.id ? characterRef.current : adapter.loadCharacter(id);
      return serialize(c ? [c] : []);
    },
    [adapter, flush],
  );

  const importJson = useCallback(
    (json: string, mode: 'add' | 'replace'): ImportResult => {
      const parsed = parseImport(json);
      if (!parsed.ok) return parsed;
      flush();
      let idx = indexRef.current;
      let first: Character | null = null;
      for (const incoming of parsed.characters) {
        const c: Character = mode === 'add' ? { ...incoming, id: newId() } : incoming;
        adapter.saveCharacter(c);
        idx = upsertSummary(idx, c);
        first ??= c;
      }
      if (first) activate(first, idx);
      return { ok: true, count: parsed.characters.length, skipped: parsed.skipped };
    },
    [activate, adapter, flush],
  );

  const value = useMemo<CharacterContextValue>(
    () => ({
      character,
      dispatch,
      saveState,
      undoHp,
      summaries: index.characters,
      activeId: character.id,
      create,
      duplicate,
      rename,
      remove,
      select,
      exportAll,
      exportOne,
      importJson,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      character, dispatch, saveState, undoHp, index.characters, create, duplicate, rename, remove,
      select, exportAll, exportOne, importJson, toasts, pushToast, dismissToast,
    ],
  );

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}
