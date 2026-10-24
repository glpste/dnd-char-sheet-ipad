import { useEffect } from 'react';
import { CheatSheetView } from './components/cheatsheet/CheatSheetView';
import { HeaderBar, VIEW_LABELS } from './components/header/HeaderBar';
import { SheetView } from './components/sheet/SheetView';
import { SpellbookView } from './components/spellbook/SpellbookView';
import { ToastHost } from './components/ui/ToastHost';
import { useViewShortcuts } from './hooks/useViewShortcuts';
import { useHashRoute } from './router/useHashRoute';
import { useCharacter } from './store/useCharacter';

export default function App() {
  const [view, setView] = useHashRoute();
  const { character } = useCharacter();
  useViewShortcuts(setView);

  useEffect(() => {
    const name = character.info.name.trim();
    document.title = name ? `${name} – D&D sheet` : 'D&D character sheet';
  }, [character.info.name]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <HeaderBar view={view} setView={setView} />
      <main className="min-h-0 flex-1 p-2">
        <h1 className="sr-only">{VIEW_LABELS[view]}</h1>
        {view === 'sheet' && <SheetView />}
        {view === 'spellbook' && <SpellbookView />}
        {view === 'cheatsheet' && <CheatSheetView />}
      </main>
      <ToastHost />
    </div>
  );
}
