import { VIEWS, type View } from '../../router/useHashRoute';
import { useCharacter, useRoster } from '../../store/useCharacter';
import { cx } from '../ui/styles';
import { CharacterInfoPopover } from './CharacterInfoPopover';
import { CharacterSwitcher } from './CharacterSwitcher';
import { ExportImportMenu } from './ExportImportMenu';
import { ThemeToggle } from './ThemeToggle';

export const VIEW_LABELS: Record<View, string> = {
  sheet: 'Sheet',
  spellbook: 'Spellbook',
  cheatsheet: 'Cheat sheet',
};

export function HeaderBar({ view, setView }: { view: View; setView: (v: View) => void }) {
  const roster = useRoster();
  const { saveState } = useCharacter();
  return (
    <header className="flex h-12 shrink-0 items-center space-x-3 border-b border-zinc-300 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
      <CharacterSwitcher {...roster} />
      <CharacterInfoPopover />
      <nav className="!ml-auto flex items-center space-x-1 rounded-md bg-zinc-200 p-0.5 dark:bg-zinc-800" aria-label="Views">
        {VIEWS.map((v, i) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            title={`${VIEW_LABELS[v]} (${i + 1})`}
            onClick={() => setView(v)}
            className={cx(
              'rounded px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500',
              view === v
                ? 'bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white',
            )}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </nav>
      <span
        className={cx(
          'w-14 text-right text-xs',
          saveState === 'saving' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500',
        )}
        aria-live="polite"
      >
        {saveState === 'saving' ? 'Saving…' : 'Saved'}
      </span>
      <ExportImportMenu />
      <ThemeToggle />
    </header>
  );
}
