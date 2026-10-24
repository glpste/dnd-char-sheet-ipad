import { useCallback, useSyncExternalStore } from 'react';

export type View = 'sheet' | 'spellbook' | 'cheatsheet';

export const VIEWS: readonly View[] = ['sheet', 'spellbook', 'cheatsheet'];

export function parseHash(hash: string): View {
  const name = hash.replace(/^#\/?/, '');
  return (VIEWS as readonly string[]).includes(name) ? (name as View) : 'sheet';
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function getSnapshot(): View {
  return parseHash(window.location.hash);
}

export function useHashRoute(): [View, (view: View) => void] {
  const view = useSyncExternalStore(subscribe, getSnapshot, () => 'sheet' as View);
  const setView = useCallback((next: View) => {
    window.location.hash = `#/${next}`;
    // Browsers queue hashchange; notify synchronously so the view flips in the same tick.
    window.dispatchEvent(new Event('hashchange'));
  }, []);
  return [view, setView];
}
