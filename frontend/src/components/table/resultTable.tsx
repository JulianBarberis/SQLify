import type { ExecuteModel } from '../../models/execute.model';
import type { TableHeaderModel } from '../../models/table-header.model';
import './resultTable.css';
import { useEffect, useState } from 'react';

type props = {executed: ExecuteModel};

export function ResultTable({executed}: props) {
  const [orderedHeaders, setOrderedHeaders] = useState([] as TableHeaderModel[]);

  const rows = (executed?.rows as Array<Record<string, unknown>>) ?? [];

  useEffect(() => {
    if (rows.length > 0) {
      const keys: string[] = Object.keys(rows[0]);
      
      const noUrlKeys: string[] = keys.filter(k => !haveUrl(k));
      const urlKeys: string[] = keys.filter(k =>  haveUrl(k));

      const ordered: string[] = ['#', ...noUrlKeys, ...urlKeys];
      const headers: TableHeaderModel[] = ordered.map(k => ({
        key: k,
        label: k === '#'
          ? '#'
          : k.charAt(0).toUpperCase() + k.slice(1)
      }));

      setOrderedHeaders(headers);
    }
  }, [executed]);

  function haveUrl(label: string) {
    return label.toLowerCase()?.includes('url');
  }

  if (rows.length === 0) return <p>Sin resultados.</p>;

  return (
    <div className="container">
      <table className="table">
        <thead className="">
          <tr>
            {orderedHeaders.map((header) => (
              <th key={header.key} className="table-header">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {orderedHeaders.map((header) => {
                const cell = header.key === '#' ? i + 1 : (row as any)[header.key];

                return(
                  <td key={header.key} className="data">
                    {header.key !== '#' && haveUrl(header.key) ? (
                      <div className="data play-container">
                        <a
                          href={String(cell ?? '')}
                          target="_blank"
                          rel="noreferrer"
                          className="play-button"
                        >
                          <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </a>
                      </div>
                    ) : (
                      typeof cell === 'object' && cell !== null
                        ? JSON.stringify(cell)
                        : String(cell ?? '')
                    )}
                  </td>
                )
            })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
