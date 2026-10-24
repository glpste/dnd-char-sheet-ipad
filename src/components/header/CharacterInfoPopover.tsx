import { useEffect, useRef, useState } from 'react';
import { useCharacter } from '../../store/useCharacter';
import { NumberField } from '../ui/NumberField';
import { TextField } from '../ui/TextField';
import { btnGhost, cx, menu } from '../ui/styles';

/** One-line character summary; click to edit race, class, level, background, alignment, XP, player. */
export function CharacterInfoPopover() {
  const { character, dispatch } = useCharacter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const info = character.info;

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

  const set = (patch: Partial<typeof info>) => dispatch({ type: 'patch', patch: { info: patch } });

  const parts = [info.race, info.class ? `${info.class} ${info.level}` : `Level ${info.level}`, info.background, info.alignment]
    .filter(Boolean)
    .join(' · ');

  const field = (label: string, key: keyof typeof info) => (
    <label className="flex flex-col space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
      {label}
      <TextField
        aria-label={label}
        value={String(info[key])}
        onChange={(v) => set({ [key]: v } as Partial<typeof info>)}
        className="border-zinc-300 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
      />
    </label>
  );

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        className={cx(btnGhost, 'max-w-[32rem] truncate text-sm text-zinc-600 dark:text-zinc-300')}
        aria-expanded={open}
        aria-label="Edit character details"
        onClick={() => setOpen((o) => !o)}
      >
        {parts || 'Set race, class and background'}
        {info.xp > 0 && <span className="ml-2 text-xs text-zinc-400">XP {info.xp}</span>}
      </button>
      {open && (
        <div className={cx(menu, 'grid w-[32rem] grid-cols-3 gap-2 p-3')}>
          <div className="col-span-3 grid grid-cols-3 gap-2">
            {field('Character name', 'name')}
            {field('Player name', 'playerName')}
            {field('Race', 'race')}
          </div>
          {field('Class', 'class')}
          <label className="flex flex-col space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Level
            <NumberField
              aria-label="Level"
              value={info.level}
              min={1}
              max={20}
              onChange={(level) => set({ level })}
              className="border-zinc-300 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
          </label>
          <label className="flex flex-col space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Experience points
            <NumberField
              aria-label="Experience points"
              value={info.xp}
              min={0}
              max={999999}
              onChange={(xp) => set({ xp })}
              className="border-zinc-300 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
          </label>
          {field('Background', 'background')}
          {field('Alignment', 'alignment')}
        </div>
      )}
    </div>
  );
}
