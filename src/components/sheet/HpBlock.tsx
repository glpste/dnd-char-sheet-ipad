import { useRef } from 'react';
import { useCharacter, useToast } from '../../store/useCharacter';
import { NumberField } from '../ui/NumberField';
import { btn, cx, panel, panelTitle } from '../ui/styles';

const QUICK: { label: string; delta: number }[] = [
  { label: '−5', delta: -5 },
  { label: '−1', delta: -1 },
  { label: '+1', delta: 1 },
  { label: '+5', delta: 5 },
];

/** Current / max / temp HP with quick ± buttons and single-level undo via toast. */
export function HpBlock() {
  const { character, dispatch, undoHp } = useCharacter();
  const { pushToast, dismissToast } = useToast();
  const hp = character.combat.hp;

  // undoHp is recomputed after dispatch; the toast reads the latest one when clicked.
  const undoRef = useRef(undoHp);
  undoRef.current = undoHp;
  // Only the most recent change is undoable, so only one Undo toast is ever shown.
  const lastToastRef = useRef<string | null>(null);

  const adjust = (delta: number) => {
    dispatch({ type: 'hp', delta });
    if (lastToastRef.current) dismissToast(lastToastRef.current);
    const verb = delta < 0 ? 'Took' : 'Healed';
    lastToastRef.current = pushToast(`${verb} ${Math.abs(delta)} hit point${Math.abs(delta) === 1 ? '' : 's'}`, {
      label: 'Undo',
      onClick: () => undoRef.current?.(),
    });
  };

  const setHp = (patch: Partial<typeof hp>) => dispatch({ type: 'patch', patch: { combat: { hp: patch } } });

  return (
    <div className={cx(panel, 'border-amber-500/70 bg-amber-50 px-2 py-1.5 dark:border-amber-500/60 dark:bg-amber-950/30')}>
      <div className="flex items-end justify-between space-x-2">
        <div>
          <div className={panelTitle}>Hit points</div>
          <div className="flex items-baseline space-x-1">
            <NumberField
              aria-label="Current hit points"
              value={hp.current}
              min={0}
              max={hp.max}
              onChange={(current) => setHp({ current })}
              className={cx('w-14 text-center text-3xl font-medium', hp.current === 0 && 'text-red-600 dark:text-red-400')}
            />
            <span className="text-zinc-400">/</span>
            <NumberField
              aria-label="Maximum hit points"
              value={hp.max}
              min={0}
              max={999}
              onChange={(max) => setHp({ max })}
              className="w-12 text-center text-lg"
            />
          </div>
        </div>
        <div className="text-center">
          <div className={panelTitle}>Temp</div>
          <NumberField
            aria-label="Temporary hit points"
            value={hp.temp}
            min={0}
            max={999}
            onChange={(temp) => setHp({ temp })}
            className="w-12 text-center text-xl"
          />
        </div>
        <div className="flex space-x-1">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              className={cx(btn, 'w-9 px-0 tabular-nums', q.delta < 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300')}
              onClick={() => adjust(q.delta)}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
