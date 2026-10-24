import { useCharacter } from '../../store/useCharacter';
import { NumberField } from '../ui/NumberField';
import { Panel } from '../ui/StatBox';
import { TextArea } from '../ui/TextArea';

const COINS = ['cp', 'sp', 'ep', 'gp', 'pp'] as const;

export function Equipment() {
  const { character, dispatch } = useCharacter();
  const eq = character.equipment;
  return (
    <Panel title="Equipment" className="min-h-0">
      <div className="mb-1 flex items-center space-x-2">
        {COINS.map((k) => (
          <label key={k} className="flex items-center space-x-1 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <span>{k.toUpperCase()}</span>
            <NumberField
              aria-label={k.toUpperCase()}
              value={eq[k]}
              min={0}
              max={999999}
              onChange={(n) => dispatch({ type: 'patch', patch: { equipment: { [k]: n } } })}
              className="w-12 text-center text-sm text-zinc-900 dark:text-zinc-100"
            />
          </label>
        ))}
      </div>
      <TextArea
        aria-label="Equipment"
        value={eq.text}
        autoGrow={false}
        minRows={3}
        placeholder="Explorer's pack, 50 ft rope, 20 arrows…"
        onChange={(text) => dispatch({ type: 'patch', patch: { equipment: { text } } })}
        className="max-h-24 overflow-y-auto"
      />
    </Panel>
  );
}
