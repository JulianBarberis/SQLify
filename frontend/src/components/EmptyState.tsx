import React from 'react';
import './EmptyState.css';

export const EmptyState: React.FC = React.memo(() => {
  return (
    <section className="empty-state-card" aria-label="Sin resultados de búsqueda">
      <div className="empty-state-icon-container" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <circle cx="18" cy="18" r="3" />
          <line x1="20.5" y1="20.5" x2="22" y2="22" />
        </svg>
      </div>
      <h3 className="empty-state-title">No se encontraron resultados</h3>
      <p className="empty-state-description">
        La consulta se ejecutó exitosamente, pero no devolvió ninguna fila en la base de datos con los filtros actuales.
      </p>

      <div className="empty-state-tips">
        <span className="empty-state-tips-heading">Sugerencias para reformular</span>
        <ul>
          <li>Prueba ampliando los filtros de fecha (ej. &ldquo;del último año&rdquo; en lugar de &ldquo;del último mes&rdquo;).</li>
          <li>Verifica la ortografía de los nombres de artistas, canciones o géneros.</li>
          <li>Intenta realizar una pregunta más general para explorar los registros disponibles.</li>
        </ul>
      </div>
    </section>
  );
});
