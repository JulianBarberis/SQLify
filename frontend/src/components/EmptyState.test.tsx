import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  it('renderiza título, descripción y sugerencias para reformular', () => {
    render(<EmptyState />);

    expect(screen.getByRole('region', { name: /sin resultados de búsqueda/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /no se encontraron resultados/i })).toBeInTheDocument();
    expect(screen.getByText(/la consulta se ejecutó exitosamente, pero no devolvió ninguna fila/i)).toBeInTheDocument();
    expect(screen.getByText(/sugerencias para reformular/i)).toBeInTheDocument();

    const tips = screen.getAllByRole('listitem');
    expect(tips).toHaveLength(3);
  });
});
