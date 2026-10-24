import { ABILITY_LABELS, type Ability } from '../../model/character';
import { abilityMod, formatMod } from '../../rules/derive';
import { useCharacter } from '../../store/useCharacter';
import { NumberField } from '../ui/NumberField';
import { cx, panel, panelTitle } from '../ui/styles';

export function AbilityBox({ ability }: { ability: Ability }) {
  const { character, dispatch } = useCharacter();
  const score = character.abilities[ability];
  return (
    <div className={cx(panel, 'flex flex-col items-center px-1 py-1.5 text-center')}>
      <div className={panelTitle} title={ABILITY_LABELS[ability]}>
        {ability.toUpperCase()}
      </div>
      <div data-testid={`mod-${ability}`} className="text-2xl font-medium leading-tight tabular-nums">
        {formatMod(abilityMod(score))}
      </div>
      <NumberField
        aria-label={`${ABILITY_LABELS[ability]} score`}
        value={score}
        min={1}
        max={30}
        onChange={(n) => dispatch({ type: 'patch', patch: { abilities: { [ability]: n } } })}
        className="w-10 text-center text-xs text-zinc-500 dark:text-zinc-400"
      />
    </div>
  );
}

export function AbilityColumn() {
  return (
    <div className="flex flex-col space-y-1.5">
      {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((a) => (
        <AbilityBox key={a} ability={a} />
      ))}
    </div>
  );
}
