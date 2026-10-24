import { useEffect, useRef, useState } from 'react';
import type { CharacterSummary } from '../../storage/adapter';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { btn, cx, input, menu, menuItem } from '../ui/styles';

export interface CharacterSwitcherProps {
  summaries: CharacterSummary[];
  activeId: string;
  create: (name?: string) => void;
  duplicate: (id: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  select: (id: string) => void;
}

type Pending = { kind: 'delete' } | { kind: 'rename'; draft: string } | null;

export function CharacterSwitcher({ summaries, activeId, create, duplicate, rename, remove, select }: CharacterSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = summaries.find((s) => s.id === activeId);
  const activeName = active?.name || 'Unnamed';

  useEffect(() => {
    if (!open) return;
    // iOS sends no mouse events for taps on non-clickable areas, so listen for touches too.
    const onDown = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const act = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cx(btn, 'max-w-[16rem] font-medium')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{activeName}</span>
        <span aria-hidden="true" className="text-xs">▾</span>
      </button>

      {open && (
        <div role="menu" className={menu}>
          {summaries.map((s) => (
            <button
              key={s.id}
              role="menuitem"
              type="button"
              className={cx(menuItem, s.id === activeId && 'font-medium text-amber-700 dark:text-amber-300')}
              onClick={act(() => select(s.id))}
            >
              {s.name || 'Unnamed'}
            </button>
          ))}
          <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
          <button role="menuitem" type="button" className={menuItem} onClick={act(() => create())}>
            New character
          </button>
          <button role="menuitem" type="button" className={menuItem} onClick={act(() => duplicate(activeId))}>
            Duplicate {activeName}
          </button>
          <button
            role="menuitem"
            type="button"
            className={menuItem}
            onClick={act(() => setPending({ kind: 'rename', draft: activeName }))}
          >
            Rename {activeName}
          </button>
          <button
            role="menuitem"
            type="button"
            className={cx(menuItem, 'text-red-700 dark:text-red-400')}
            onClick={act(() => setPending({ kind: 'delete' }))}
          >
            Delete {activeName}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pending?.kind === 'delete'}
        title={`Delete ${activeName}?`}
        confirmLabel="Delete"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          setPending(null);
          remove(activeId);
        }}
      >
        This removes the character from this browser. Export it first if you want a backup.
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'rename'}
        title="Rename character"
        confirmLabel="Rename"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === 'rename') rename(activeId, pending.draft.trim() || activeName);
          setPending(null);
        }}
      >
        <input
          type="text"
          aria-label="Character name"
          autoFocus
          className={cx(input, 'w-full border-zinc-300 dark:border-zinc-700')}
          value={pending?.kind === 'rename' ? pending.draft : ''}
          onChange={(e) => setPending({ kind: 'rename', draft: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && pending?.kind === 'rename') {
              rename(activeId, pending.draft.trim() || activeName);
              setPending(null);
            }
          }}
        />
      </ConfirmDialog>
    </div>
  );
}
