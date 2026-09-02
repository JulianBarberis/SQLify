import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert Component', () => {
  it('resuelve correctamente cada categoría de insignia (badge)', () => {
    const { rerender } = render(<ErrorAlert title="Connection timeout" />);
    expect(screen.getByText('Tiempo Agotado')).toBeInTheDocument();

    rerender(<ErrorAlert title="Error" status={429} />);
    expect(screen.getByText('Límite Excedido')).toBeInTheDocument();

    rerender(<ErrorAlert title="Acceso denied" status={403} />);
    expect(screen.getByText('Permiso Denegado')).toBeInTheDocument();

    rerender(<ErrorAlert title="Error de parse" status={400} />);
    expect(screen.getByText('Error de Sintaxis')).toBeInTheDocument();

    rerender(<ErrorAlert title="High demand" status={503} />);
    expect(screen.getByText('Servicio No Disponible')).toBeInTheDocument();

    rerender(<ErrorAlert title="Cualquier otro fallo" status={500} />);
    expect(screen.getByText('Error de Ejecución')).toBeInTheDocument();
  });

  it('provee detalle explicativo automático cuando title contiene timeout y no hay detail', () => {
    render(<ErrorAlert title="Request timeout" />);
    expect(screen.getByText(/la consulta tardó más de lo esperado en procesarse/i)).toBeInTheDocument();
  });

  it('renderiza detail explícito cuando se proporciona', () => {
    render(<ErrorAlert title="Error general" detail="Falta parámetro requerido" />);
    expect(screen.getByText('Falta parámetro requerido')).toBeInTheDocument();
  });

  it('muestra la consulta SQL en el acordeón de detalles cuando se proporciona', () => {
    render(<ErrorAlert title="Sintaxis errónea" sql="SELECT * FROM Unknown" />);
    expect(screen.getByText('Ver consulta SQL con error')).toBeInTheDocument();
    expect(screen.getByText('SELECT * FROM Unknown')).toBeInTheDocument();
  });

  it('ejecuta callbacks onRetry y onDismiss al interactuar con los botones', async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <ErrorAlert
        title="Fallo temporal"
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
    );

    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    await user.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);

    const dismissBtn = screen.getByRole('button', { name: /cerrar notificación de error/i });
    await user.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
