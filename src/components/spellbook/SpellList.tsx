import { useEffect, useRef, useState } from 'react';
import { SPELL_LEVELS, type Spell, type SpellLevel } from '../../model/character';
import { useCharacter } from '../../store/useCharacter';
import { Panel } from '../ui/StatBox';
import { Toggle } from '../ui/Toggle';
import { btn, cx, input, menu, menuItem } from '../ui/styles';
import { SpellEntry, levelLabel } from './SpellEntry';

function AddSpellMenu({ onAdd }: { onAdd: (level: SpellLevel) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    // iOS sends no mouse events for taps on non-clickable areas, so listen for touches too.
    const onDown = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);
  return (
    <div ref={rootRef} className="relative">
      <button type="button" className={btn} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Add spell
      </button>
      {open && (
        <div role="menu" className={cx(menu, 'right-0')}>
          {SPELL_LEVELS.map((l) => (
            <button
              key={l}
              role="menuitem"
              type="button"
              className={menuItem}
              onClick={() => {
                setOpen(false);
                onAdd(l);
              }}
            >
              {levelLabel(l)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SpellList() {
  const { character, dispatch } = useCharacter();
  const [preparedOnly, setPreparedOnly] = useState(false);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const spells = character.spellbook.spells;
  const matches = (s: Spell) => (!preparedOnly || s.prepared) && (!q || s.name.toLowerCase().includes(q));
  const groups = SPELL_LEVELS.map((level) => ({
    level,
    spells: spells.map((s, index) => ({ s, index })).filter(({ s }) => s.level === level && matches(s)),
  })).filter((g) => g.spells.length > 0);

  return (
    <Panel
      title="Spells"
      className="min-h-0 flex-1"
      right={
        <div className="flex items-center space-x-3">
          <input
            type="search"
            aria-label="Search spells"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cx(input, 'w-40 border-zinc-300 text-sm dark:border-zinc-700')}
          />
          <Toggle label="Prepared only" checked={preparedOnly} onChange={setPreparedOnly} />
          <AddSpellMenu onAdd={(level) => dispatch({ type: 'spell/add', level })} />
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {groups.length === 0 && (
          <p className="py-4 text-sm text-zinc-400 dark:text-zinc-500">
            {spells.length === 0 ? 'No spells yet. Add one, then type anything you like into it.' : 'No spells match.'}
          </p>
        )}
        {groups.map((g) => (
          <section key={g.level} data-testid={`spell-level-${g.level}`} className="mb-3">
            <h3 className="sticky top-0 bg-white py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              {g.level === 0 ? 'Cantrips' : `Level ${g.level}`}
            </h3>
            <ul>
              {g.spells.map(({ s, index }, i) => (
                <SpellEntry key={s.id} spell={s} index={index} isFirst={i === 0} isLast={i === g.spells.length - 1} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Panel>
  );
}
