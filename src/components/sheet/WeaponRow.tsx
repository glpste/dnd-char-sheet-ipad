import { useState } from 'react';
import type { Weapon, WeaponAbility } from '../../model/character';
import { weaponAttackBonus, weaponDamageBonus } from '../../rules/derive';
import { formatDamage } from '../../rules/formatDamage';
import { useCharacter, useToast } from '../../store/useCharacter';
import { DerivedField } from '../ui/DerivedField';
import { NumberField } from '../ui/NumberField';
import { TextArea } from '../ui/TextArea';
import { TextField } from '../ui/TextField';
import { btnGhost, cx, input } from '../ui/styles';
import { WEAPON_GRID } from './weaponGrid';

const ABILITY_OPTIONS: { value: WeaponAbility; label: string }[] = [
  { value: 'str', label: 'STR' },
  { value: 'dex', label: 'DEX' },
  { value: 'finesse', label: 'Finesse (STR or DEX)' },
  { value: 'con', label: 'CON' },
  { value: 'int', label: 'INT' },
  { value: 'wis', label: 'WIS' },
  { value: 'cha', label: 'CHA' },
  { value: 'none', label: 'None' },
];

export function WeaponRow({ weapon, index, count }: { weapon: Weapon; index: number; count: number }) {
  const { character, dispatch } = useCharacter();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const w = weapon;
  const name = w.name || 'weapon';

  const update = (patch: Partial<Weapon>) => dispatch({ type: 'weapon/update', id: w.id, patch });

  const autoAttack = weaponAttackBonus(character, { ...w, attackOverride: undefined });
  const autoDamage = weaponDamageBonus(character, { ...w, damageBonusOverride: undefined });
  const damage = formatDamage(w.damageDice, weaponDamageBonus(character, w), w.damageType);

  const remove = () => {
    dispatch({ type: 'weapon/remove', id: w.id });
    pushToast(`Removed ${name}`, {
      label: 'Undo',
      onClick: () => dispatch({ type: 'weapon/restore', weapon: w, index }),
    });
  };

  const labelCls = 'flex flex-col space-y-0.5 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400';

  return (
    <li data-testid="weapon-row" className="border-b border-zinc-200 py-1 last:border-b-0 dark:border-zinc-800">
      <div className={cx(WEAPON_GRID, 'items-center text-sm')}>
        <button
          type="button"
          aria-label={`${open ? 'Collapse' : 'Expand'} ${name}`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        </button>
        <TextField aria-label="Weapon name" value={w.name} placeholder="Weapon" onChange={(v) => update({ name: v })} className="font-medium" />
        <DerivedField
          label="Attack bonus"
          auto={autoAttack}
          override={w.attackOverride}
          onOverride={(n) => update({ attackOverride: n })}
          inputClassName="w-11 font-medium"
        />
        <button
          type="button"
          data-testid="damage"
          title={damage || 'Set damage dice'}
          onClick={() => setOpen(true)}
          className={cx('truncate rounded px-1 text-left tabular-nums hover:bg-zinc-100 dark:hover:bg-zinc-800', !damage && 'text-zinc-400')}
        >
          {damage || 'damage…'}
        </button>
        <TextField aria-label="Range" value={w.range} placeholder="5 ft" onChange={(v) => update({ range: v })} className="text-xs" />
      </div>

      {w.effects && !open && (
        <div className="ml-5 truncate text-xs text-amber-700 dark:text-amber-300" title={w.effects}>
          {w.effects.split('\n')[0]}
        </div>
      )}

      {open && (
        <div className="ml-5 mt-1 grid grid-cols-4 gap-2 rounded bg-zinc-50 p-2 dark:bg-zinc-950/60">
          <label className={labelCls}>
            Ability
            <select
              aria-label="Ability"
              value={w.ability}
              onChange={(e) => update({ ability: e.target.value as WeaponAbility })}
              className={cx(input, 'border-zinc-300 text-sm normal-case tracking-normal dark:border-zinc-700 dark:bg-zinc-900')}
            >
              {ABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center space-x-2 self-end text-sm">
            <input type="checkbox" aria-label="Proficient" checked={w.proficient} onChange={(e) => update({ proficient: e.target.checked })} className="accent-amber-500" />
            <span>Proficient</span>
          </label>
          <label className={labelCls}>
            Magic bonus
            <NumberField aria-label="Magic bonus" value={w.magicBonus} min={-5} max={10} signed onChange={(magicBonus) => update({ magicBonus })} className="w-12 border-zinc-300 text-center text-sm dark:border-zinc-700" />
          </label>
          <label className={labelCls}>
            Damage bonus
            <DerivedField label="Damage bonus" auto={autoDamage} override={w.damageBonusOverride} onOverride={(n) => update({ damageBonusOverride: n })} inputClassName="border-zinc-300 text-sm dark:border-zinc-700" />
          </label>
          <label className={labelCls}>
            Damage dice
            <TextField aria-label="Damage dice" value={w.damageDice} placeholder="1d8" onChange={(v) => update({ damageDice: v })} className="border-zinc-300 text-sm normal-case tracking-normal dark:border-zinc-700" />
          </label>
          <label className={labelCls}>
            Damage type
            <TextField aria-label="Damage type" value={w.damageType} placeholder="piercing" onChange={(v) => update({ damageType: v })} className="border-zinc-300 text-sm normal-case tracking-normal dark:border-zinc-700" />
          </label>
          <label className={cx(labelCls, 'col-span-2')}>
            Properties
            <TextField aria-label="Properties" value={w.properties} placeholder="finesse, light" onChange={(v) => update({ properties: v })} className="border-zinc-300 text-sm normal-case tracking-normal dark:border-zinc-700" />
          </label>
          <label className={cx(labelCls, 'col-span-2')}>
            Special effects
            <TextArea aria-label="Special effects" value={w.effects} placeholder={"Hunter's Mark +1d6\nOn crit: …"} onChange={(v) => update({ effects: v })} className="border-zinc-300 normal-case tracking-normal dark:border-zinc-700" />
          </label>
          <label className={cx(labelCls, 'col-span-2')}>
            Notes
            <TextArea aria-label="Notes" value={w.notes} onChange={(v) => update({ notes: v })} className="border-zinc-300 normal-case tracking-normal dark:border-zinc-700" />
          </label>
          <div className="col-span-4 flex justify-end space-x-1">
            <button type="button" className={btnGhost} aria-label={`Move ${name} up`} disabled={index === 0} onClick={() => dispatch({ type: 'weapon/move', id: w.id, dir: -1 })}>
              ↑
            </button>
            <button type="button" className={btnGhost} aria-label={`Move ${name} down`} disabled={index === count - 1} onClick={() => dispatch({ type: 'weapon/move', id: w.id, dir: 1 })}>
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
