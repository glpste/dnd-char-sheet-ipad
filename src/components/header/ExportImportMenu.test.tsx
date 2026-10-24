import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { newCharacter } from '../../model/character';
import { serialize } from '../../store/exportImport';
import { renderWithCharacter } from '../../test/renderWithCharacter';
import { ToastHost } from '../ui/ToastHost';
import { ExportImportMenu, importResultMessage } from './ExportImportMenu';

describe('ExportImportMenu', () => {
  it('closes on Escape', async () => {
    renderWithCharacter(<ExportImportMenu />);
    await userEvent.click(screen.getByRole('button', { name: 'Export / import' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  describe('paste JSON import', () => {
    async function openPasteBox() {
      await userEvent.click(screen.getByRole('button', { name: 'Export / import' }));
      await userEvent.click(screen.getByRole('menuitem', { name: 'Paste JSON…' }));
      return screen.getByRole('textbox', { name: 'Character JSON' });
    }

    it('imports a pasted export file as a new character', async () => {
      const { store } = renderWithCharacter(
        <>
          <ExportImportMenu />
          <ToastHost />
        </>,
      );
      const box = await openPasteBox();
      await userEvent.click(box);
      await userEvent.paste(serialize([newCharacter('Pasted Pete')]));
      await userEvent.click(screen.getByRole('button', { name: 'Import' }));
      expect(screen.getByRole('dialog', { name: 'Import characters' })).toHaveTextContent('Found 1 character');
      await userEvent.click(screen.getByRole('button', { name: 'Add as new' }));
      expect([...store.chars.values()].map((c) => c.info.name)).toContain('Pasted Pete');
      expect(screen.getByRole('status')).toHaveTextContent('Imported 1 character');
    });

    it('shows the parse error for text that is not JSON', async () => {
      renderWithCharacter(
        <>
          <ExportImportMenu />
          <ToastHost />
        </>,
      );
      const box = await openPasteBox();
      await userEvent.click(box);
      await userEvent.paste('not json');
      await userEvent.click(screen.getByRole('button', { name: 'Import' }));
      expect(screen.getByRole('status')).toHaveTextContent('not valid JSON');
      expect(screen.queryByRole('dialog', { name: 'Import characters' })).not.toBeInTheDocument();
    });
  });
});

describe('ExportImportMenu on iOS 10', () => {
  it('closes when a touch starts outside the menu', async () => {
    renderWithCharacter(<ExportImportMenu />);
    await userEvent.click(screen.getByRole('button', { name: 'Export / import' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.touchStart(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('imports from a file without Blob.prototype.text', async () => {
    const original = Object.getOwnPropertyDescriptor(Blob.prototype, 'text');
    Object.defineProperty(Blob.prototype, 'text', { value: undefined, configurable: true });
    try {
      renderWithCharacter(<ExportImportMenu />);
      const file = new File([serialize([newCharacter('From File')])], 'c.json', { type: 'application/json' });
      await userEvent.upload(screen.getByLabelText('Import file'), file);
      expect(await screen.findByRole('dialog', { name: 'Import characters' })).toHaveTextContent('Found 1 character');
    } finally {
      if (original) Object.defineProperty(Blob.prototype, 'text', original);
    }
  });

  it('shows the export JSON in a dialog instead of downloading', async () => {
    renderWithCharacter(<ExportImportMenu />);
    await userEvent.click(screen.getByRole('button', { name: 'Export / import' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Export Thalia' }));
    const dialog = screen.getByRole('dialog', { name: 'Export JSON' });
    expect(dialog).toBeInTheDocument();
    expect((screen.getByRole('textbox', { name: 'Exported JSON' }) as HTMLTextAreaElement).value).toContain('"Thalia"');
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Export JSON' })).not.toBeInTheDocument();
  });

  it('Copy selects the whole JSON and copies it through execCommand', async () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    try {
      renderWithCharacter(
        <>
          <ExportImportMenu />
          <ToastHost />
        </>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Export / import' }));
      await userEvent.click(screen.getByRole('menuitem', { name: 'Export Thalia' }));
      await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
      const box = screen.getByRole('textbox', { name: 'Exported JSON' }) as HTMLTextAreaElement;
      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(box.selectionStart).toBe(0);
      expect(box.selectionEnd).toBe(box.value.length);
      expect(screen.getByRole('status')).toHaveTextContent('Copied');
    } finally {
      delete (document as { execCommand?: unknown }).execCommand;
    }
  });
});

describe('importResultMessage', () => {
  it('mentions skipped entries', () => {
    expect(importResultMessage({ ok: true, count: 1, skipped: 0 })).toBe('Imported 1 character');
    expect(importResultMessage({ ok: true, count: 2, skipped: 1 })).toBe('Imported 2 characters, 1 skipped');
    expect(importResultMessage({ ok: false, error: 'bad' })).toBe('bad');
  });
});
