import { useEffect, useRef, useState } from 'react';
import type { ImportResult } from '../../store/CharacterProvider';
import { parseImport } from '../../store/exportImport';
import { useRoster, useToast } from '../../store/useCharacter';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { btn, menu, menuItem } from '../ui/styles';

/** iOS ignores HTMLTextAreaElement.select(); setSelectionRange works on a readonly field. */
function selectAll(el: HTMLTextAreaElement | null): void {
  if (!el) return;
  el.setSelectionRange(0, el.value.length);
}

/** Safari 10 has no Blob.prototype.text, so read files the old way. */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsText(file);
  });
}

export function importResultMessage(result: ImportResult): string {
  if (!result.ok) return result.error;
  const base = `Imported ${result.count} character${result.count === 1 ? '' : 's'}`;
  return result.skipped > 0 ? `${base}, ${result.skipped} skipped` : base;
}

export function ExportImportMenu() {
  const { summaries, activeId, exportAll, exportOne, importJson } = useRoster();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ json: string; count: number; skipped: number } | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);
  const exportRef = useRef<HTMLTextAreaElement>(null);
  const [pasteText, setPasteText] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // iOS sends no mouse events for taps on non-clickable areas, so listen for touches too.
    const onDown = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeName = summaries.find((s) => s.id === activeId)?.name ?? 'character';

  useEffect(() => {
    if (exportText !== null) selectAll(exportRef.current);
  }, [exportText]);

  /** Parses pasted or loaded JSON and, if valid, asks how to import it. Returns whether it parsed. */
  const handleJsonText = (json: string): boolean => {
    const parsed = parseImport(json);
    if (!parsed.ok) {
      pushToast(parsed.error);
      return false;
    }
    setPendingImport({ json, count: parsed.characters.length, skipped: parsed.skipped });
    return true;
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    handleJsonText(await readFileText(file));
  };

  const copyExport = () => {
    const ta = exportRef.current;
    if (!ta) return;
    ta.focus();
    selectAll(ta);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    pushToast(ok ? 'Copied to clipboard' : 'Copy failed: select the text and copy it by hand');
  };

  const closePaste = () => {
    setPasteOpen(false);
    setPasteText('');
  };

  const submitPaste = () => {
    if (handleJsonText(pasteText)) closePaste();
  };

  const finishImport = (mode: 'add' | 'replace') => {
    if (!pendingImport) return;
    const result = importJson(pendingImport.json, mode);
    setPendingImport(null);
    pushToast(importResultMessage(result));
  };

  return (
    <div ref={rootRef} className="relative">
      <button type="button" className={btn} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Export / import
      </button>
      {open && (
        <div role="menu" className={`${menu} right-0`}>
          <button
            role="menuitem"
            type="button"
            className={menuItem}
            onClick={() => {
              setOpen(false);
              setExportText(exportOne(activeId));
            }}
          >
            Export {activeName}
          </button>
          <button
            role="menuitem"
            type="button"
            className={menuItem}
            onClick={() => {
              setOpen(false);
              setExportText(exportAll());
            }}
          >
            Export all characters
          </button>
          <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
          <button
            role="menuitem"
            type="button"
            className={menuItem}
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
          >
            Import from file…
          </button>
          <button
            role="menuitem"
            type="button"
            className={menuItem}
            onClick={() => {
              setOpen(false);
              setPasteOpen(true);
            }}
          >
            Paste JSON…
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Import file"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <ConfirmDialog
        open={exportText !== null}
        title="Export JSON"
        confirmLabel="Copy"
        cancelLabel="Close"
        onConfirm={copyExport}
        onCancel={() => setExportText(null)}
      >
        <p>iOS 10 cannot download files. Select all, copy, and paste this into the app on another device.</p>
        <textarea
          ref={exportRef}
          aria-label="Exported JSON"
          readOnly
          className="mt-2 h-40 w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          value={exportText ?? ''}
          onFocus={(e) => selectAll(e.target)}
        />
      </ConfirmDialog>
      <ConfirmDialog open={pasteOpen} title="Paste JSON" confirmLabel="Import" onConfirm={submitPaste} onCancel={closePaste}>
        <p>Paste an exported character (or export file) below.</p>
        <textarea
          aria-label="Character JSON"
          className="mt-2 h-40 w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          spellCheck={false}
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={pendingImport !== null}
        title="Import characters"
        confirmLabel="Add as new"
        secondaryLabel="Replace existing"
        onSecondary={() => finishImport('replace')}
        onConfirm={() => finishImport('add')}
        onCancel={() => setPendingImport(null)}
      >
        Found {pendingImport?.count} character{pendingImport?.count === 1 ? '' : 's'}
        {pendingImport && pendingImport.skipped > 0 ? ` (${pendingImport.skipped} unreadable entr${pendingImport.skipped === 1 ? 'y' : 'ies'} will be skipped)` : ''}.
        Add them as new characters, or replace any existing character that has the same id?
      </ConfirmDialog>
    </div>
  );
}
