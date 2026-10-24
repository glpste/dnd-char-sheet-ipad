import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cx, input } from './styles';

export interface NumberFieldProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  'aria-label': string;
  /** Show a leading + for non-negative numbers (modifier style). */
  signed?: boolean;
}

function clamp(n: number, min?: number, max?: number): number {
  let v = n;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  return v;
}

function format(n: number, signed: boolean): string {
  return signed && n >= 0 ? `+${n}` : String(n);
}

/**
 * Text input that behaves like a number: selects all on focus, commits on blur or
 * Enter, steps with arrow keys, and reverts to the previous value when left empty.
 */
export function NumberField({ value, onChange, min, max, className, signed = false, ...rest }: NumberFieldProps) {
  const [text, setText] = useState(() => format(value, signed));
  const [editing, setEditing] = useState(false);
  // Enter commits and then blurs; the blur must not commit a second time.
  const committedRef = useRef(false);
  // iOS Safari does not blur the field when a tap switches views, so commit on unmount too.
  const latestRef = useRef<{ editing: boolean; text: string; commit: (raw: string) => void }>({ editing: false, text: '', commit: () => {} });

  useEffect(() => {
    if (!editing) setText(format(value, signed));
  }, [value, signed, editing]);

  const commit = (raw: string) => {
    if (committedRef.current) return;
    committedRef.current = true;
    const parsed = Number.parseInt(raw.replace(/^\+/, ''), 10);
    if (Number.isNaN(parsed)) {
      setText(format(value, signed));
      return;
    }
    const next = clamp(parsed, min, max);
    setText(format(next, signed));
    if (next !== value) onChange(next);
  };

  latestRef.current = { editing, text, commit };
  useEffect(() => {
    return () => {
      const { editing: wasEditing, text: lastText, commit: lastCommit } = latestRef.current;
      if (wasEditing) lastCommit(lastText);
    };
  }, []);

  const step = (delta: number) => {
    const next = clamp(value + delta, min, max);
    setText(format(next, signed));
    if (next !== value) onChange(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit(e.currentTarget.value);
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      step(e.shiftKey ? 5 : 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      step(e.shiftKey ? -5 : -1);
    } else if (e.key === 'Escape') {
      setText(format(value, signed));
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={rest['aria-label']}
      className={cx(input, 'tabular-nums', className)}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={(e) => {
        setEditing(true);
        committedRef.current = false;
        e.target.select();
      }}
      onBlur={(e) => {
        setEditing(false);
        commit(e.target.value);
      }}
      onKeyDown={onKeyDown}
    />
  );
}
