import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Explosión en componente hijo');
  }
  return <div>Contenido sin error</div>;
};

describe('ErrorBoundary Component', () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: vi.fn() },
    });
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renderiza a sus hijos normalmente si no ocurren errores', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Contenido sin error')).toBeInTheDocument();
  });

  it('captura el error y renderiza la pantalla de fallback por defecto', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { level: 2, name: /algo salió mal/i })).toBeInTheDocument();
    expect(screen.getByText('Explosión en componente hijo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('renderiza fallback personalizado si se suministra', () => {
    render(
      <ErrorBoundary fallback={<div>Fallback personalizado</div>}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Fallback personalizado')).toBeInTheDocument();
  });

  it('ejecuta recarga al hacer clic en Reintentar y responde a eventos hover', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryBtn = screen.getByRole('button', { name: /reintentar/i });

    // Hover
    fireEvent.mouseOver(retryBtn);
    expect(retryBtn.style.backgroundColor).toBe('rgb(30, 215, 96)');

    fireEvent.mouseOut(retryBtn);
    expect(retryBtn.style.backgroundColor).toBe('rgb(29, 185, 84)');

    // Click
    fireEvent.click(retryBtn);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
