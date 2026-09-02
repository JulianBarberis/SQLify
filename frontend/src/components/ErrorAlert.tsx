import React from 'react';
import './ErrorAlert.css';

export interface ErrorAlertProps {
  title: string;
  detail?: string;
  sql?: string;
  status?: number;
  onRetry?: () => void;
  onDismiss?: () => void;
}

function resolveCategoryBadge(title: string, status?: number): string {
  const lower = title.toLowerCase();
  if (status === 429 || lower.includes('demasiadas-peticiones') || lower.includes('rate limit')) {
    return 'Límite Excedido';
  }
  if (status === 403 || lower.includes('permiso') || lower.includes('denied')) {
    return 'Permiso Denegado';
  }
  if (status === 400 || lower.includes('sintaxis') || lower.includes('parse') || lower.includes('inválida')) {
    return 'Error de Sintaxis';
  }
  if (status === 503 || lower.includes('demand') || lower.includes('unavailable')) {
    return 'Servicio No Disponible';
  }
  return 'Error de Ejecución';
}

export const ErrorAlert: React.FC<ErrorAlertProps> = React.memo(({
  title,
  detail,
  sql,
  status,
  onRetry,
  onDismiss,
}) => {
  const badgeText = resolveCategoryBadge(title, status);

  return (
    <section className="error-alert-container" role="alert" aria-live="assertive">
      <div className="error-alert-header">
        <div className="error-alert-title-group">
          <span className="error-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {badgeText}
          </span>
          <h3 className="error-alert-title">{title}</h3>
        </div>
        {onDismiss && (
          <button
            type="button"
            className="error-close-button"
            onClick={onDismiss}
            aria-label="Cerrar notificación de error"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {detail && <p className="error-alert-detail">{detail}</p>}

      {sql && (
        <details className="error-sql-details">
          <summary>Ver consulta SQL con error</summary>
          <pre><code>{sql}</code></pre>
        </details>
      )}

      {onRetry && (
        <div className="error-alert-actions">
          <button
            type="button"
            className="error-retry-button"
            onClick={onRetry}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Reintentar</span>
          </button>
        </div>
      )}
    </section>
  );
});
