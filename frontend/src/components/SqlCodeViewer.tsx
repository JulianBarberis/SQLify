import React, { useState, useCallback } from 'react';
import './SqlCodeViewer.css';

interface Props {
  sql: string;
}

export const SqlCodeViewer: React.FC<Props> = React.memo(({ sql }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  }, [sql]);

  return (
    <section className="sql-viewer-container" aria-label="Consulta SQL generada">
      <header className="sql-viewer-header">
        <span className="sql-viewer-badge">SQL Generada</span>
        <button
          type="button"
          className={`sql-copy-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label={copied ? 'Consulta copiada al portapapeles' : 'Copiar consulta SQL'}
        >
          {copied ? (
            <>
              <svg className="sql-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <svg className="sql-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copiar SQL</span>
            </>
          )}
        </button>
      </header>
      <pre className="sql-code-content">
        <code>{sql}</code>
      </pre>
    </section>
  );
});
