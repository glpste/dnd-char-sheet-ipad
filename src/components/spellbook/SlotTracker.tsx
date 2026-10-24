import { useState } from 'react';
import { SLOT_LEVELS } from '../../model/character';
import { useCharacter } from '../../store/useCharacter';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { NumberField } from '../ui/NumberField';
import { Pips } from '../ui/Pips';
import { Panel } from '../ui/StatBox';
import { btn, cx } from '../ui/styles';

export function SlotTracker() {
  const { character, dispatch } = useCharacter();
  const [editing, setEditing] = useState(false);
  const [confirmRest, setConfirmRest] = useState(false);
  const slots = character.spellbook.slots;
  const visible = SLOT_LEVELS.filter((l) => editing || slots[l].total > 0);

  return (
    <Panel
      title="Spell slots"
      right={
        <div className="flex space-x-1">
          <button type="button" className={btn} aria-pressed={editing} onClick={() => setEditing((e) => !e)}>
            {editing ? 'Done' : 'Edit slots'}
          </button>
          <button type="button" className={btn} onClick={() => setConfirmRest(true)}>
            Long rest
          </button>
        </div>
      }
    >
      {visible.length === 0 && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No spell slots. Use “Edit slots” to set totals per level.</p>
      )}
      <div className="flex flex-col space-y-1">
        {visible.map((l) => (
          <div key={l} data-testid={`slots-${l}`} className="flex items-center space-x-3 text-sm">
            <span className="w-14 text-zinc-500 dark:text-zinc-400">Level {l}</span>
            {editing ? (
              <NumberField
                aria-label={`Level ${l} slots`}
                value={slots[l].total}
                min={0}
                max={9}
                onChange={(total) =>
                  dispatch({
                    type: 'patch',
                    patch: { spellbook: { slots: { [l]: { total, used: Math.min(slots[l].used, total) } } } },
                  })
                }
                className="w-10 border-zinc-300 text-center dark:border-zinc-700"
              />
            ) : (
              <Pips
                label={`Level ${l} slot`}
                total={slots[l].total}
                filled={slots[l].used}
                onToggle={(index) => dispatch({ type: 'slots/toggle', level: l, index })}
              />
            )}
            <span className={cx('!ml-auto tabular-nums text-xs text-zinc-400')}>
              {slots[l].total - slots[l].used} / {slots[l].total} left
            </span>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={confirmRest}
        title="Take a long rest?"
        confirmLabel="Reset slots"
        onCancel={() => setConfirmRest(false)}
        onConfirm={() => {
          dispatch({ type: 'slots/longRest' });
          setConfirmRest(false);
        }}
      >
        All used spell slots are restored. Hit points and hit dice are not changed.
      </ConfirmDialog>
    </Panel>
  );
}
