import { useCharacter } from '../../store/useCharacter';
import { Pips } from '../ui/Pips';
import { cx, panel, panelTitle } from '../ui/styles';

type Count = 0 | 1 | 2 | 3;

export function DeathSaves() {
  const { character, dispatch } = useCharacter();
  const ds = character.combat.deathSaves;
  const toggle = (key: 'successes' | 'failures', index: number) => {
    const cur = ds[key];
    const next = (index < cur ? index : index + 1) as Count;
    dispatch({ type: 'patch', patch: { combat: { deathSaves: { [key]: next } } } });
  };
  return (
    <div className={cx(panel, 'px-2 py-1.5')}>
      <div className={panelTitle}>Death saves</div>
      <div className="mt-1 flex flex-col space-y-1 text-xs">
        <div className="flex items-center justify-between space-x-2">
          <span className="text-zinc-500 dark:text-zinc-400">Successes</span>
          <Pips label="Death save success" total={3} filled={ds.successes} variant="success" onToggle={(i) => toggle('successes', i)} />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <span className="text-zinc-500 dark:text-zinc-400">Failures</span>
          <Pips label="Death save failure" total={3} filled={ds.failures} variant="danger" onToggle={(i) => toggle('failures', i)} />
        </div>
      </div>
    </div>
  );
}
