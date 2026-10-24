import type { ReactNode } from 'react';
import { cx, panel, panelTitle } from './styles';

export interface StatBoxProps {
  label: string;
  children: ReactNode;
  /** Small line under the main value. */
  sub?: ReactNode;
  className?: string;
  accent?: boolean;
}

/** Labelled box with a big value, the basic building block of the sheet. */
export function StatBox({ label, children, sub, className, accent = false }: StatBoxProps) {
  return (
    <div
      className={cx(
        panel,
        'flex flex-col items-center px-2 py-1.5 text-center',
        accent && 'border-amber-500/70 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-950/30',
        className,
      )}
    >
      <div className={panelTitle}>{label}</div>
      <div className="text-2xl font-medium leading-tight tabular-nums">{children}</div>
      {sub !== undefined && <div className="text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>}
    </div>
  );
}

export function Panel({ title, children, className, right }: { title?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={cx(panel, 'flex min-h-0 flex-col px-2 py-1.5', className)}>
      {(title || right) && (
        <header className="mb-1 flex items-center justify-between space-x-2">
          {title && <h2 className={panelTitle}>{title}</h2>}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}
