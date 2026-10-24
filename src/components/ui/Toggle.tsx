import { cx } from './styles';

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  className?: string;
}

/** Accessible switch rendered as a small pill. */
export function Toggle({ checked, onChange, label, hideLabel = false, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      onClick={() => onChange(!checked)}
      className={cx('inline-flex items-center space-x-2 text-sm', className)}
    >
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-block h-4 w-7 rounded-full transition-colors',
          checked ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform',
            checked ? 'translate-x-3.5' : 'translate-x-0.5',
          )}
        />
      </span>
      {!hideLabel && <span>{label}</span>}
    </button>
  );
}
