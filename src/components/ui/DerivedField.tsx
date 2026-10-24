import { formatMod } from '../../rules/derive';
import { NumberField } from './NumberField';
import { cx } from './styles';

export interface DerivedFieldProps {
  /** The computed value. */
  auto: number;
  /** Manual override, when set. */
  override?: number;
  /** Called with a number to override, or undefined to reset to auto. */
  onOverride: (n: number | undefined) => void;
  label: string;
  signed?: boolean;
  className?: string;
  inputClassName?: string;
}

/**
 * Auto-calculated number the user can still type over. When overridden, a small
 * "auto" button next to it restores the computed value.
 */
export function DerivedField({ auto, override, onOverride, label, signed = true, className, inputClassName }: DerivedFieldProps) {
  const shown = override ?? auto;
  const overridden = override !== undefined;
  return (
    <span className={cx('inline-flex items-center space-x-1', className)}>
      <NumberField
        aria-label={label}
        value={shown}
        signed={signed}
        min={-99}
        max={99}
        onChange={(n) => onOverride(n === auto ? undefined : n)}
        className={cx(
          'w-10 text-center',
          overridden && 'border-dashed border-amber-500/70 text-amber-700 dark:text-amber-300',
          inputClassName,
        )}
      />
      {overridden && (
        <button
          type="button"
          onClick={() => onOverride(undefined)}
          title={`Reset to auto (${signed ? formatMod(auto) : auto})`}
          aria-label={`Reset ${label} to auto`}
          className="rounded px-1 text-[10px] uppercase tracking-wide text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950"
        >
          auto
        </button>
      )}
    </span>
  );
}
