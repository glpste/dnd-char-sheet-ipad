import { useState } from 'react';
import { SPELL_LEVELS, type Spell, type SpellLevel } from '../../model/character';
import { useCharacter, useToast } from '../../store/useCharacter';
import { TextArea } from '../ui/TextArea';
import { TextField } from '../ui/TextField';
import { Toggle } from '../ui/Toggle';
import { btnGhost, cx, input } from '../ui/styles';

export function levelLabel(level: SpellLevel): string {
  return level === 0 ? 'Cantrip' : `Level ${level}`;
}

export function SpellEntry({
  spell,
  index,
  isFirst,
  isLast,
}: {
  spell: Spell;
  /** Position in the flat spell list (used to restore after undo). */
  index: number;
  /** Position within the spell's level group (drives the move buttons). */
  isFirst: boolean;
  isLast: boolean;
}) {
  const { dispatch } = useCharacter();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(!spell.name);
  const s = spell;
  const name = s.name || 'spell';
  const update = (patch: Partial<Spell>) => dispatch({ type: 'spell/update', id: s.id, patch });

  const remove = () => {
    dispatch({ type: 'spell/remove', id: s.id });
    pushToast(`Removed ${name}`, { label: 'Undo', onClick: () => dispatch({ type: 'spell/restore', spell: s, index }) });
  };

  const meta = [s.castingTime, s.range, s.components, s.duration].filter(Boolean).join(' · ');
  const small = 'flex flex-col space-y-0.5 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400';
  const field = 'border-zinc-300 text-sm normal-case tracking-normal dark:border-zinc-700';

  return (
    <li className="border-b border-zinc-200 py-1 last:border-b-0 dark:border-zinc-800">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          aria-label={`${open ? 'Collapse' : 'Expand'} ${name}`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        </button>
        <Toggle label="Prepared" hideLabel checked={s.prepared} onChange={(prepared) => update({ prepared })} />
        <TextField aria-label="Spell name" value={s.name} placeholder="Spell name" onChange={(v) => update({ name: v })} className={cx('font-medium', s.prepared && 'text-amber-800 dark:text-amber-200')} />
        {!open && meta && <span className="hidden truncate text-xs text-zinc-400 lg:inline">{meta}</span>}
      </div>
      {!open && s.description && (
        <p className="ml-7 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{s.description}</p>
      )}
      {open && (
        <div className="ml-7 mt-1 grid grid-cols-5 gap-2 rounded bg-zinc-50 p-2 dark:bg-zinc-950/60">
          <label className={small}>
            Level
            <select
              aria-label="Spell level"
              value={s.level}
              onChange={(e) => update({ level: Number(e.target.value) as SpellLevel })}
              className={cx(input, field, 'dark:bg-zinc-900')}
            >
              {SPELL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {levelLabel(l)}
                </option>
              ))}
            </select>
          </label>
          <label className={small}>
            Casting time
            <TextField aria-label="Casting time" value={s.castingTime} placeholder="1 action" onChange={(v) => update({ castingTime: v })} className={field} />
          </label>
          <label className={small}>
            Range
            <TextField aria-label="Spell range" value={s.range} placeholder="60 ft" onChange={(v) => update({ range: v })} className={field} />
          </label>
          <label className={small}>
            Components
            <TextField aria-label="Components" value={s.components} placeholder="V, S, M" onChange={(v) => update({ components: v })} className={field} />
          </label>
          <label className={small}>
            Duration
            <TextField aria-label="Duration" value={s.duration} placeholder="Instantaneous" onChange={(v) => update({ duration: v })} className={field} />
          </label>
          <label className={cx(small, 'col-span-5')}>
            Description
            <TextArea aria-label="Description" value={s.description} minRows={3} placeholder="What the spell does, damage, saves, higher-level scaling…" onChange={(v) => update({ description: v })} className={field} />
          </label>
          <div className="col-span-5 flex justify-end space-x-1">
            <button type="button" className={btnGhost} aria-label={`Move ${name} up`} disabled={isFirst} onClick={() => dispatch({ type: 'spell/move', id: s.id, dir: -1 })}>
              ↑
            </button>
            <button type="button" className={btnGhost} aria-label={`Move ${name} down`} disabled={isLast} onClick={() => dispatch({ type: 'spell/move', id: s.id, dir: 1 })}>
              ↓
            </button>
            <button type="button" className={cx(btnGhost, 'text-red-700 dark:text-red-400')} aria-label={`Remove ${name}`} onClick={remove}>
              Remove
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
