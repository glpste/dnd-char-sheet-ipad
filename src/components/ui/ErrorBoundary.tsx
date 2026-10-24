import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CHAR_PREFIX, INDEX_KEY } from '../../storage/localStorageAdapter';
import { downloadJson } from '../../store/exportImport';
import { btn, btnPrimary } from './styles';

interface Props {
  children: ReactNode;
  /** Injected for tests; defaults to a full page reload. */
  reload?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence: a stored record the app cannot render must never turn
 * into a permanent white page. Offers a raw export of everything in storage and
 * a way to start from a fresh character without deleting anything.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('dnd-sheet: render error', error, info.componentStack);
  }

  private exportAllRaw = () => {
    const characters: unknown[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(CHAR_PREFIX)) continue;
        try {
          characters.push(JSON.parse(localStorage.getItem(key) ?? 'null'));
        } catch {
          characters.push({ corruptKey: key, raw: localStorage.getItem(key) });
        }
      }
    } catch {
      /* storage unavailable: nothing to export */
    }
    downloadJson(
      `dnd-characters-recovery-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ app: 'dnd-sheet', version: 1, characters }, null, 2),
    );
  };

  private startFresh = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(INDEX_KEY) ?? '{}') as { characters?: unknown };
      const characters = Array.isArray(raw.characters) ? raw.characters : [];
      // Keep every record; only forget which one was active so the next load creates a new character.
      localStorage.setItem(INDEX_KEY, JSON.stringify({ activeId: null, characters }));
    } catch {
      /* fall through to reload */
    }
    (this.props.reload ?? (() => window.location.reload()))();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-100 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="max-w-lg rounded-lg border border-zinc-300 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h1 className="text-lg font-medium">Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            The sheet could not be drawn, most likely because a stored or imported character has an unexpected
            shape. Your data is still in this browser. Export it now, then start with a new character; the
            existing records stay in storage and can be re-imported later.
          </p>
          <pre className="mt-3 max-h-32 overflow-auto rounded bg-zinc-100 p-2 text-xs text-red-700 dark:bg-zinc-950 dark:text-red-300">
            {this.state.error.message}
          </pre>
          <div className="mt-4 flex flex-wrap justify-end space-x-2">
            <button type="button" className={btn} onClick={() => window.location.reload()}>
              Reload
            </button>
            <button type="button" className={btn} onClick={this.exportAllRaw}>
              Export all characters
            </button>
            <button type="button" className={btnPrimary} onClick={this.startFresh}>
              Start with a new character
            </button>
          </div>
        </div>
      </div>
    );
  }
}
