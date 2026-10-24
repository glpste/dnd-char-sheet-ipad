import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { NumberField } from './NumberField';

function Harness({ max }: { max?: number }) {
  const [v, setV] = useState(12);
  return (
    <>
      <NumberField aria-label="Score" value={v} onChange={setV} min={1} max={max} />
      <output data-testid="out">{v}</output>
    </>
  );
}

describe('NumberField', () => {
  it('keeps the old value when cleared and blurred', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Score');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(screen.getByTestId('out')).toHaveTextContent('12');
    expect(input).toHaveValue('12');
  });

  it('clamps to max on commit', async () => {
    render(<Harness max={30} />);
    const input = screen.getByLabelText('Score');
    await userEvent.clear(input);
    await userEvent.type(input, '35{Enter}');
    expect(screen.getByTestId('out')).toHaveTextContent('30');
  });

  it('commits exactly once on Enter', async () => {
    const onChange = vi.fn();
    render(<NumberField aria-label="Score" value={12} onChange={onChange} />);
    const input = screen.getByLabelText('Score');
    await userEvent.clear(input);
    await userEvent.type(input, '7{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('arrow keys step by one', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Score');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}');
    expect(screen.getByTestId('out')).toHaveTextContent('13');
  });
});

describe('NumberField on iOS 10', () => {
  it('commits a typed value when unmounted before blur', async () => {
    const onChange = vi.fn();
    const { unmount } = render(<NumberField aria-label="Score" value={12} onChange={onChange} />);
    const input = screen.getByLabelText('Score');
    await userEvent.clear(input);
    await userEvent.type(input, '7');
    expect(onChange).not.toHaveBeenCalled();
    unmount();
    expect(onChange).toHaveBeenCalledWith(7);
  });
});
