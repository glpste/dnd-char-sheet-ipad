import { useToast } from '../../store/useCharacter';
import { btnGhost } from './styles';

/** Bottom-right stack of transient messages, each with an optional action (e.g. Undo). */
export function ToastHost() {
  const { toasts, dismissToast } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col space-y-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-center space-x-3 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-lg motion-safe:animate-fade-in dark:border-zinc-700 dark:bg-zinc-900"
        >
          <span>{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="font-medium text-amber-600 hover:underline dark:text-amber-400"
              onClick={() => {
                t.action?.onClick();
                dismissToast(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button type="button" aria-label="Dismiss" className={btnGhost} onClick={() => dismissToast(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
