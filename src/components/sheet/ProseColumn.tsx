import { useCharacter } from '../../store/useCharacter';
import { Panel } from '../ui/StatBox';
import { TextArea } from '../ui/TextArea';

const PERSONALITY = [
  { key: 'traits', label: 'Personality traits' },
  { key: 'ideals', label: 'Ideals' },
  { key: 'bonds', label: 'Bonds' },
  { key: 'flaws', label: 'Flaws' },
] as const;

/** Column D: the PDF's prose boxes. Features fills whatever height is left and scrolls inside. */
export function ProseColumn() {
  const { character, dispatch } = useCharacter();
  return (
    <div className="flex min-h-0 flex-col space-y-1.5">
      {PERSONALITY.map((p) => (
        <Panel key={p.key} title={p.label} className="max-h-28">
          <TextArea
            aria-label={p.label}
            value={character.personality[p.key]}
            autoGrow={false}
            minRows={2}
            onChange={(v) => dispatch({ type: 'patch', patch: { personality: { [p.key]: v } } })}
            className="min-h-0 flex-1 overflow-y-auto"
          />
        </Panel>
      ))}
      <Panel title="Features and traits" className="min-h-0 flex-1">
        <TextArea
          aria-label="Features and traits"
          value={character.features}
          autoGrow={false}
          minRows={6}
          placeholder="Favored Enemy · Natural Explorer · Fighting Style (Archery)…"
          onChange={(features) => dispatch({ type: 'patch', patch: { features } })}
          className="h-full min-h-0 flex-1 overflow-y-auto"
        />
      </Panel>
    </div>
  );
}
