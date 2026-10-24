import { useEffect, useRef, type ReactNode } from 'react';
import { btn, btnDanger, btnPrimary, cx } from './styles';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  danger?: boolean;
  /** Label of the cancel button; `null` hides it (for informational dialogs). */
  cancelLabel?: string | null;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal confirmation. Rendered as a plain overlay (not <dialog>) so it behaves the
 * same in jsdom and browsers. Focus starts on the confirm button, Tab cycles inside
 * the dialog, Escape cancels, and focus returns to the opener on close.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  secondaryLabel,
  onSecondary,
  danger = false,
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Read through a ref so an inline onCancel does not re-run the focus effect on every render.
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    confirmRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onTouchEnd={(e) => {
        // iOS synthesises a click after touchend at the same point; prevent it from hitting
        // whatever sits under the removed backdrop.
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-lg border border-zinc-300 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h2 id="confirm-title" className="text-base font-medium">
          {title}
        </h2>
        {children && <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{children}</div>}
        <div className="mt-4 flex justify-end space-x-2">
          <button ref={confirmRef} type="button" className={cx(danger ? btnDanger : btnPrimary)} onClick={onConfirm}>
            {confirmLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button type="button" className={btn} onClick={onSecondary}>
              {secondaryLabel}
            </button>
          )}
          {cancelLabel !== null && (
            <button type="button" className={btn} onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
