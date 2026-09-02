import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResultTable } from './resultTable';

describe('ResultTable Component', () => {
  it('renderiza EmptyState cuando executed o rows es nulo, indefinido o vacío', () => {
    const { rerender } = render(<ResultTable executed={{ rowCount: 0, rows: [] }} />);
    expect(screen.getByRole('region', { name: /sin resultados de búsqueda/i })).toBeInTheDocument();

    rerender(<ResultTable executed={null as any} />);
    expect(screen.getByRole('region', { name: /sin resultados de búsqueda/i })).toBeInTheDocument();

    rerender(<ResultTable executed={undefined as any} />);
    expect(screen.getByRole('region', { name: /sin resultados de búsqueda/i })).toBeInTheDocument();
  });

  it('renderiza tabla con datos, links de url con valores reales y nulos', () => {
    const rows = [
      {
        ID_Cancion: 'cancion_1',
        titulo: 'Blinding Lights',
        reproducciones: 1500000,
        spotify_url: 'https://open.spotify.com/track/123',
        detalles_json: { genero: 'Synthwave' },
        observaciones: null,
      },
      {
        id: 2,
        titulo: 'Save Your Tears',
        reproducciones: 800000,
        spotify_url: 'https://open.spotify.com/track/456',
        detalles_json: { genero: 'Pop' },
        observaciones: undefined,
      },
      {
        id: 3,
        titulo: 'In Your Eyes',
        reproducciones: 500000,
        spotify_url: null, // cubre la rama cell ?? '' cuando cell es nulo/undefined en columna url
        detalles_json: null,
        observaciones: 'Ok',
      },
    ];

    const { container } = render(<ResultTable executed={{ rowCount: rows.length, rows }} />);

    expect(screen.getByRole('table', { name: /tabla de registros encontrados/i })).toBeInTheDocument();
    expect(screen.getByText('Blinding Lights')).toBeInTheDocument();
    expect(screen.getByText('Save Your Tears')).toBeInTheDocument();
    expect(screen.getByText('In Your Eyes')).toBeInTheDocument();

    const playButtons = container.querySelectorAll('a.play-button');
    expect(playButtons).toHaveLength(3);
    expect(playButtons[0]).toHaveAttribute('href', 'https://open.spotify.com/track/123');
    expect(playButtons[1]).toHaveAttribute('href', 'https://open.spotify.com/track/456');
    expect(playButtons[2]).toHaveAttribute('href', '');
  });

  it('renderiza claves alternativas (ID_Artista, ID_Usuario, row-index) y tipos primitivos en celdas', () => {
    const rows = [
      {
        ID_Artista: 'art_1',
        nombre: 'Queen',
        observaciones: 'Banda británica',
        detalles: 42,
      },
      {
        ID_Usuario: 'usr_1',
        nombre: 'Julian',
        observaciones: null,
        detalles: false,
      },
      {
        nombre: 'Sin ID',
        observaciones: undefined,
        detalles: 'texto',
      },
    ];

    render(<ResultTable executed={{ rowCount: rows.length, rows }} />);

    expect(screen.getByText('Queen')).toBeInTheDocument();
    expect(screen.getByText('Julian')).toBeInTheDocument();
    expect(screen.getByText('Sin ID')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
  });
});
