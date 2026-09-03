import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SqlCodeViewer } from './SqlCodeViewer';

describe('SqlCodeViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza la consulta SQL dentro de code', () => {
    render(<SqlCodeViewer sql="SELECT * FROM Artista LIMIT 10;" />);

    expect(screen.getByText('SELECT * FROM Artista LIMIT 10;')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copiar consulta sql/i })).toBeInTheDocument();
  });

  it('copia al portapapeles y cambia temporalmente el texto del botón a "¡Copiado!"', async () => {
    vi.useFakeTimers();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: writeTextMock },
    });

    render(<SqlCodeViewer sql="SELECT * FROM Cancion;" />);

    const copyBtn = screen.getByRole('button', { name: /copiar consulta sql/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith('SELECT * FROM Cancion;');
    expect(screen.getByText('¡Copiado!')).toBeInTheDocument();

    // Avanzamos los 2 segundos
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Copiar SQL')).toBeInTheDocument();
  });

  it('captura errores si el acceso al portapapeles falla', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Permiso de portapapeles denegado')),
      },
    });

    render(<SqlCodeViewer sql="SELECT 1;" />);

    const copyBtn = screen.getByRole('button', { name: /copiar consulta sql/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error al copiar al portapapeles:',
      expect.any(Error)
    );
  });
});
