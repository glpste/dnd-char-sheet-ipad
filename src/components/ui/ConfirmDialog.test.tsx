import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('traps focus inside the dialog', async () => {
    render(
      <>
        <button>outside</button>
        <ConfirmDialog open title="Sure?" confirmLabel="Go" onConfirm={() => {}} onCancel={() => {}} />
      </>,
    );
    const go = screen.getByRole('button', { name: 'Go' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(go).toHaveFocus();
    await userEvent.tab();
    expect(cancel).toHaveFocus();
    await userEvent.tab();
    expect(go).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(cancel).toHaveFocus();
  });

  it('restores focus to the opener when closed', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>opener</button>
          <ConfirmDialog open={open} title="Sure?" confirmLabel="Go" onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </>
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'opener' }));
    expect(screen.getByRole('button', { name: 'Go' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'opener' })).toHaveFocus();
  });
});

describe('ConfirmDialog on iOS 10', () => {
  it('hides the Cancel button when cancelLabel is null', () => {
    render(<ConfirmDialog open title="Info" confirmLabel="Close" cancelLabel={null} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('cancels on touchend on the backdrop and suppresses the synthesised click', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Sure?" confirmLabel="Go" onConfirm={() => {}} onCancel={onCancel} />);
    const backdrop = screen.getByRole('dialog').parentElement!;
    const touchEnd = new Event('touchend', { bubbles: true, cancelable: true });
    backdrop.dispatchEvent(touchEnd);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(touchEnd.defaultPrevented).toBe(true);
  });

  it('does not cancel on touches that end on the panel', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Sure?" confirmLabel="Go" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.touchEnd(screen.getByRole('dialog'));
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe('ConfirmDialog with a controlled child', () => {
  function PasteHarness() {
    const [open, setOpen] = useState(true);
    const [text, setText] = useState('');
    return (
      <ConfirmDialog open={open} title="Paste" confirmLabel="Import" onConfirm={() => {}} onCancel={() => setOpen(false)}>
        <textarea aria-label="Box" value={text} onChange={(e) => setText(e.target.value)} />
      </ConfirmDialog>
    );
  }

  it('keeps focus and value in the child while typing, despite an inline onCancel', async () => {
    render(<PasteHarness />);
    const box = screen.getByRole('textbox', { name: 'Box' });
    await userEvent.click(box);
    await userEvent.type(box, 'abc');
    expect(box).toHaveValue('abc');
    expect(box).toHaveFocus();
  });
});
