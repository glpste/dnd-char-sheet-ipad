import { useCharacter } from '../../store/useCharacter';
import { NumberField } from '../ui/NumberField';
import { TextField } from '../ui/TextField';
import { cx, panel, panelTitle } from '../ui/styles';

export function HitDice() {
  const { character, dispatch } = useCharacter();
  const hd = character.combat.hitDice;
  return (
    <div className={cx(panel, 'px-2 py-1.5')}>
      <div className={panelTitle}>Hit dice</div>
      <div className="flex items-baseline space-x-1">
        <NumberField
          aria-label="Hit dice remaining"
          value={hd.current}
          min={0}
          max={99}
          onChange={(current) => dispatch({ type: 'patch', patch: { combat: { hitDice: { current } } } })}
          className="w-10 text-center text-xl font-medium"
        />
        <span className="text-zinc-400">/</span>
        <TextField
          aria-label="Hit dice total"
          value={hd.total}
          placeholder="5d10"
          onChange={(total) => dispatch({ type: 'patch', patch: { combat: { hitDice: { total } } } })}
          className="w-16 text-sm"
        />
      </div>
    </div>
  );
}
