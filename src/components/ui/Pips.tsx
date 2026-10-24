import { cx } from './styles';

export interface PipsProps {
  total: number;
  filled: number;
  /** Called with the 0-based index of the clicked pip. */
  onToggle: (index: number) => void;
  label: string;
  variant?: 'neutral' | 'success' | 'danger';
  className?: string;
}

const FILL: Record<NonNullable<PipsProps['variant']>, string> = {
  neutral: 'bg-amber-500 border-amber-500',
  success: 'bg-emerald-500 border-emerald-500',
  danger: 'bg-red-500 border-red-500',
};

/** Row of clickable circles, e.g. death saves or spell slots. */
export function Pips({ total, filled, onToggle, label, variant = 'neutral', className }: PipsProps) {
  return (
    <div role="group" aria-label={label} className={cx('flex flex-wrap items-center space-x-1', className)}>
      {Array.from({ length: total }, (_, i) => {
        const on = i < filled;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${label} ${i + 1}`}
            aria-pressed={on}
            onClick={() => onToggle(i)}
            className={cx(
              'h-4 w-4 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500',
              on ? FILL[variant] : 'border-zinc-400 bg-transparent dark:border-zinc-600',
            )}
          />
        );
      })}
    </div>
  );
}
