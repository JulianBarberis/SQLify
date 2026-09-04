import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as appService from './service/appService';
import { toast } from 'react-toastify';
import axios from 'axios';

vi.mock('react-toastify', async () => {
  const actual = await vi.importActual('react-toastify');
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
    ToastContainer: () => <div data-testid="toast-container" />,
  };
});

describe('App Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza estructura básica y maneja interacción del tooltip de información', async () => {
    const { unmount } = render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ej. top 10 artistas más escuchados/i)).toBeInTheDocument();

    const infoBtn = screen.getByRole('button', { name: /información adicional sobre consultas/i });

    // Hover
    fireEvent.mouseEnter(infoBtn);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(infoBtn);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Focus & Blur
    fireEvent.focus(infoBtn);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(infoBtn);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Click toggle
    fireEvent.click(infoBtn);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.click(infoBtn);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Desmontar para disparar el cleanup de useEffect (abortControllerRef)
    unmount();
  });

  it('muestra toast de error al intentar buscar con el campo vacío o solo espacios', async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchBtn = screen.getByRole('button', { name: /buscar/i });
    await user.click(searchBtn);

    expect(toast.error).toHaveBeenCalledWith('Por favor ingrese una consulta');
  });

  it('ejecuta búsqueda exitosa al presionar el botón de búsqueda y muestra estado de carga', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void = () => {};
    const deferred = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(appService, 'sendRequest').mockImplementation(() => deferred as any);

    render(<App />);

    const input = screen.getByPlaceholderText(/ej. top 10 artistas más escuchados/i);
    await user.type(input, 'Top artistas');

    const searchBtn = screen.getByRole('button', { name: /buscar/i });
    await user.click(searchBtn);

    // Estado loading
    expect(screen.getByRole('button', { name: /ejecutando…/i })).toBeInTheDocument();

    resolvePromise({
      sql: 'SELECT * FROM Artista LIMIT 5;',
      explain: 'Consulta generada exitosamente',
      executed: {
        rowCount: 1,
        rows: [{ ID_Artista: 1, nombre: 'Coldplay', seguidores: 9000000 }],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('SELECT * FROM Artista LIMIT 5;')).toBeInTheDocument();
      expect(screen.getByText('Coldplay')).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith('Consulta generada exitosamente');
    });
  });

  it('ejecuta búsqueda al pulsar un chip de consulta sugerida', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      sql: 'SELECT * FROM Usuario WHERE plan = "premium";',
      explain: 'Usuarios premium encontrados',
      executed: {
        rowCount: 1,
        rows: [{ ID_Usuario: 10, nombre: 'Ana Gómez', plan: 'premium' }],
      },
    };
    vi.spyOn(appService, 'sendRequest').mockResolvedValueOnce(mockResponse);

    render(<App />);

    const chip = screen.getByRole('button', { name: 'Usuarios con plan premium' });
    await user.click(chip);

    await waitFor(() => {
      expect(screen.getByText('SELECT * FROM Usuario WHERE plan = "premium";')).toBeInTheDocument();
      expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
    });
  });

  it('ejecuta búsqueda con atajos de teclado Ctrl+Enter y Cmd+Enter e ignora otras teclas', async () => {
    const mockResponse = {
      sql: 'SELECT 1;',
      explain: 'Atajo ejecutado',
      executed: { rowCount: 1, rows: [{ ok: 1 }] },
    };
    vi.spyOn(appService, 'sendRequest').mockResolvedValue(mockResponse);

    render(<App />);

    const textarea = screen.getByPlaceholderText(/ej. top 10 artistas más escuchados/i);

    // Tecla normal (no Enter con Ctrl/Cmd)
    fireEvent.keyDown(textarea, { key: 'a' });
    expect(appService.sendRequest).not.toHaveBeenCalled();

    fireEvent.change(textarea, { target: { value: 'Buscar con ctrl' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(appService.sendRequest).toHaveBeenCalledWith('Buscar con ctrl', expect.any(AbortSignal));
    });

    fireEvent.change(textarea, { target: { value: 'Buscar con cmd' } });
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

    await waitFor(() => {
      expect(appService.sendRequest).toHaveBeenCalledWith('Buscar con cmd', expect.any(AbortSignal));
    });
  });

  it('captura errores de la API, renderiza ErrorAlert y muestra SQL fallida si está presente', async () => {
    const user = userEvent.setup();
    const apiError = {
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          error: 'permiso-denegado',
          detail: 'No tienes permisos para ejecutar esta consulta',
          sql: 'DROP TABLE Artista;',
        },
      },
    };
    vi.spyOn(appService, 'sendRequest').mockRejectedValueOnce(apiError);

    render(<App />);

    const input = screen.getByPlaceholderText(/ej. top 10 artistas más escuchados/i);
    await user.type(input, 'Borrar artistas');

    const searchBtn = screen.getByRole('button', { name: /buscar/i });
    await user.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Permiso Denegado')).toBeInTheDocument();
      expect(screen.getByText('No tienes permisos para ejecutar esta consulta')).toBeInTheDocument();
      expect(screen.getAllByText('DROP TABLE Artista;').length).toBeGreaterThan(0);
    });

    // Reintentar
    vi.spyOn(appService, 'sendRequest').mockResolvedValueOnce({
      sql: 'SELECT 1;',
      explain: 'Reintento exitoso',
      executed: { rowCount: 1, rows: [{ id: 1 }] },
    });

    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('SELECT 1;')).toBeInTheDocument();
    });
  });

  it('ignora cancelaciones de peticiones vía axios.isCancel', async () => {
    const cancelError = new Error('Canceled');
    const cancelSpy = vi.spyOn(axios, 'isCancel').mockReturnValue(true);
    vi.spyOn(appService, 'sendRequest').mockRejectedValueOnce(cancelError);

    render(<App />);

    const textarea = screen.getByPlaceholderText(/ej. top 10 artistas más escuchados/i);
    fireEvent.change(textarea, { target: { value: 'Cancelada' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(appService.sendRequest).toHaveBeenCalled();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    cancelSpy.mockRestore();
  });

  it('permite cerrar la alerta de error con el botón de descartar', async () => {
    const user = userEvent.setup();
    vi.spyOn(appService, 'sendRequest').mockRejectedValueOnce(new Error('Fallo crítico'));

    render(<App />);

    const input = screen.getByPlaceholderText(/ej. top 10 artistas más escuchados/i);
    await user.type(input, 'Fallo');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /cerrar notificación de error/i });
    await user.click(closeBtn);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

  it('no invoca toast.success si response.explain está ausente o vacío', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      sql: 'SELECT 1;',
      explain: '',
      executed: { rowCount: 1, rows: [{ id: 1 }] },
    };
    vi.spyOn(appService, 'sendRequest').mockResolvedValueOnce(mockResponse);

    render(<App />);

    const input = screen.getByPlaceholderText(/ej. top 10 artistas más escuchados/i);
    await user.type(input, 'Consulta sin explain');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('SELECT 1;')).toBeInTheDocument();
    });

    expect(toast.success).not.toHaveBeenCalled();
  });

  it('no altera el estado de loading si otra búsqueda posterior toma el control', async () => {
    vi.spyOn(appService, 'sendRequest')
      .mockImplementationOnce((_q, signal) => {
        return new Promise((_, reject) => {
          signal?.addEventListener('abort', () => {
            const err = new Error('canceled');
            vi.spyOn(axios, 'isCancel').mockReturnValueOnce(true);
            reject(err);
          });
        });
      })
      .mockResolvedValueOnce({ sql: 'SELECT 2;', explain: 'Segunda consulta' });

    render(<App />);

    const textarea = screen.getByPlaceholderText(/ej. top 10 artistas más escuchados/i);
    fireEvent.change(textarea, { target: { value: 'Primera' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    // Segunda búsqueda vía atajo de teclado
    fireEvent.change(textarea, { target: { value: 'Segunda' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByText('SELECT 2;')).toBeInTheDocument();
    });
  });
