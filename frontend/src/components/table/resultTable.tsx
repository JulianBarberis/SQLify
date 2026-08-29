import React, { useMemo } from 'react';
import type { ExecuteModel } from '../../models/execute.model';
import type { TableHeaderModel } from '../../models/table-header.model';
import './resultTable.css';

type Props = { executed: ExecuteModel };

const haveUrl = (label: string): boolean => label.toLowerCase().includes('url');

export const ResultTable = React.memo(function ResultTable({ executed }: Props) {
  const rows = useMemo(() => {
    return (executed?.rows as Array<Record<string, unknown>>) ?? [];
  }, [executed]);

  const orderedHeaders = useMemo<TableHeaderModel[]>(() => {
    if (!rows.length) return [];
    const keys: string[] = Object.keys(rows[0]);
    const noUrlKeys: string[] = keys.filter((k) => !haveUrl(k));
    const urlKeys: string[] = keys.filter((k) => haveUrl(k));

    const ordered: string[] = ['#', ...noUrlKeys, ...urlKeys];
    return ordered.map((k) => ({
      key: k,
      label: k === '#' ? '#' : k.charAt(0).toUpperCase() + k.slice(1),
    }));
  }, [rows]);

  if (rows.length === 0) {
    return <p className="no-results">Sin resultados.</p>;
  }

  return (
    <div className="container table-responsive-container" tabIndex={0} role="region" aria-label="Resultados de la consulta">
      <table className="table" aria-label="Tabla de registros encontrados">
        <thead>
          <tr>
            {orderedHeaders.map((header) => (
              <th key={header.key} scope="col" className="table-header">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => {
            const rowKey = String(row.id ?? row.id_cancion ?? row.id_usuario ?? `row-${i}`);
            return (
              <tr key={rowKey}>
                {orderedHeaders.map((header) => {
                  const cell = header.key === '#' ? i + 1 : row[header.key];

                  return (
                    <td key={header.key} className="data">
                      {header.key !== '#' && haveUrl(header.key) ? (
                        <div className="data play-container">
                          <a
                            href={String(cell ?? '')}
                            target="_blank"
                            rel="noreferrer"
                            className="play-button"
                            aria-label={`Reproducir pista ${i + 1} (abre en nueva pestaña)`}
                          >
                            <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M8 5v14l11-7z" fill="currentColor" />
                            </svg>
                          </a>
                        </div>
                      ) : cell === null || cell === undefined ? (
                        <span className="null-indicator">—</span>
                      ) : typeof cell === 'object' ? (
                        JSON.stringify(cell)
                      ) : (
                        String(cell)
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
