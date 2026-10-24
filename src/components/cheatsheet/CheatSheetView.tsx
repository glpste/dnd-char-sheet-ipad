import { useState } from 'react';
import { CHEAT_SHEET, SRD_ATTRIBUTION } from '../../rules/srdCheatSheet';
import { useCharacter } from '../../store/useCharacter';
import { Panel } from '../ui/StatBox';
import { TextArea } from '../ui/TextArea';
import { cx, input } from '../ui/styles';
import { CheatSection } from './CheatSection';

export function CheatSheetView() {
  const { character, dispatch } = useCharacter();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const sections = q
    ? CHEAT_SHEET.filter((s) => s.title.toLowerCase().includes(q) || s.lines.some((l) => l.toLowerCase().includes(q)))
    : CHEAT_SHEET;

  return (
    <div className="grid h-full min-h-0 grid-cols-[2fr_1fr] gap-2">
      <div className="flex min-h-0 flex-col space-y-2">
        <input
          type="search"
          aria-label="Search cheat sheet"
          placeholder="Search rules, e.g. cover, grapple, concentration"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cx(input, 'w-full border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900')}
        />
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="columns-2 gap-2 [&>*]:mb-2 [&>*]:break-inside-avoid">
            {sections.map((s) => (
              <CheatSection key={s.id} section={s} highlight={query} />
            ))}
          </div>
          {sections.length === 0 && <p className="py-4 text-sm text-zinc-400">Nothing matches “{query}”.</p>}
          <p className="py-2 text-xs text-zinc-400 dark:text-zinc-500">{SRD_ATTRIBUTION}</p>
        </div>
      </div>
      <Panel title="Personal notes" className="min-h-0">
        <TextArea
          aria-label="Personal notes"
          value={character.notes}
          autoGrow={false}
          minRows={10}
          placeholder="House rules, class reminders, things you keep forgetting…"
          onChange={(notes) => dispatch({ type: 'patch', patch: { notes } })}
          className="h-full min-h-0 flex-1 overflow-y-auto"
        />
      </Panel>
    </div>
  );
}
