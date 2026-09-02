import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PromptChips } from './PromptChips';

describe('PromptChips Component', () => {
  it('renderiza todos los chips sugeridos y responde al clic', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(<PromptChips onSelectPrompt={handleSelect} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(screen.getByText('Usuarios con plan premium')).toBeInTheDocument();

    await user.click(screen.getByText('Usuarios con plan premium'));
    expect(handleSelect).toHaveBeenCalledWith('Usuarios con plan premium');
  });

  it('deshabilita los botones cuando disabled es true', () => {
    render(<PromptChips onSelectPrompt={vi.fn()} disabled={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
