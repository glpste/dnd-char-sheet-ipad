import { mod } from '../../rules/derive';
import { useCharacter } from '../../store/useCharacter';
import { DerivedField } from '../ui/DerivedField';
import { NumberField } from '../ui/NumberField';
import { TextField } from '../ui/TextField';
import { cx, panel, panelTitle } from '../ui/styles';
import { DeathSaves } from './DeathSaves';
import { Equipment } from './Equipment';
import { HitDice } from './HitDice';
import { HpBlock } from './HpBlock';
import { WeaponsTable } from './WeaponsTable';

function TopStats() {
  const { character, dispatch } = useCharacter();
  const c = character.combat;
  const box = cx(panel, 'flex flex-col items-center px-2 py-1.5 text-center');
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <div className={box}>
        <div className={panelTitle}>Armor class</div>
        <NumberField
          aria-label="Armor class"
          value={c.ac}
          min={0}
          max={40}
          onChange={(ac) => dispatch({ type: 'patch', patch: { combat: { ac } } })}
          className="w-12 text-center text-2xl font-medium"
        />
      </div>
      <div className={box}>
        <div className={panelTitle}>Initiative</div>
        <DerivedField
          label="Initiative"
          auto={mod(character, 'dex')}
          override={c.initiativeOverride}
          onOverride={(n) => dispatch({ type: 'patch', patch: { combat: { initiativeOverride: n } } })}
          inputClassName="w-12 text-2xl font-medium"
        />
      </div>
      <div className={box}>
        <div className={panelTitle}>Speed</div>
        <TextField
          aria-label="Speed"
          value={c.speed}
          placeholder="30 ft"
          onChange={(speed) => dispatch({ type: 'patch', patch: { combat: { speed } } })}
          className="w-16 text-center text-xl font-medium"
        />
      </div>
    </div>
  );
}

/** Column C: pinned combat stats; weapons and equipment are added below in later tasks. */
export function CombatColumn({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col space-y-1.5">
      <TopStats />
      <HpBlock />
      <div className="grid grid-cols-2 gap-1.5">
        <HitDice />
        <DeathSaves />
      </div>
      <WeaponsTable />
      <Equipment />
      {children}
    </div>
  );
}
