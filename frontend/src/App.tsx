import './App.css';
import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { sendRequest } from './service/appService';
import { ResultTable } from './components/table/resultTable';
import { SqlCodeViewer } from './components/SqlCodeViewer';
import { ErrorAlert } from './components/ErrorAlert';
import type { DataResponseModel } from './models/data-response.model';
import { parseApiError } from './clases/error-parser';
import logo from './assets/logo-completo.png';
import infoIcon from './assets/info.svg';

interface ApiErrorState {
  title: string;
  detail?: string;
  sql?: string;
  status?: number;
}

function App() {
  const [userQuery, setUserQuery] = useState('');
  const [result, setResult] = useState<DataResponseModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [apiError, setApiError] = useState<ApiErrorState | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const information: string = 'A tener en cuenta: las consultas muy complejas pueden ser generadas de forma errónea, lo que produce un error al correr la query. De ser así, se mostrará únicamente la query.';

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const executeSearch = useCallback(async (queryText: string): Promise<void> => {
    const trimmedQuery = queryText.trim();
    if (!trimmedQuery) {
      toast.error('Por favor ingrese una consulta');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setResult(null);
    setApiError(null);
    setLoading(true);

    try {
      const response = await sendRequest(trimmedQuery, controller.signal);
      setResult(response);
      if (response.explain) {
        toast.success(response.explain);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        return;
      }

      const error = parseApiError(err);
      setApiError(error);
      toast.error(error.title, { autoClose: 6000 });

      if (error.sql) {
        setResult({ sql: error.sql });
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSearch(userQuery);
  };

  return (
    <main>
      <div className="header"> 
        <img src={logo} alt="SQLify Logo" className="logo" />
      </div>

      <div className="container">
        <h1>Traductor a SQL :D</h1>

        <div>
          <p>Te ayudamos con la Base de Datos generando las consultas a partir de un lenguaje natural mediante una IA</p>

          <form className="form-conatainer" onSubmit={handleSubmit}>
            <div className="info-container">
              <label htmlFor="askme-input">Escribí lo que quieras escuchar</label>
              <button
                type="button"
                className="tooltip-trigger"
                aria-label="Información adicional sobre consultas"
                aria-expanded={showInfo}
                aria-controls="query-disclaimer"
                onClick={() => setShowInfo(prev => !prev)}
                onFocus={() => setShowInfo(true)}
                onBlur={() => setShowInfo(false)}
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
              >
                <img src={infoIcon} alt="" aria-hidden="true" />
              </button>
              {showInfo && (
                <div id="query-disclaimer" role="tooltip" className="tooltip-box">
                  {information}
                </div>
              )}
            </div>

            <textarea
              id="askme-input"
              rows={4}
              value={userQuery}
              aria-describedby={showInfo ? 'query-disclaimer' : undefined}
              onChange={e => setUserQuery(e.target.value)}
              placeholder="Ej. Top 10 artistas más escuchados el último mes..."
            />

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'EJECUTANDO…' : 'BUSCAR'}
            </button>
          </form>
        </div>
      </div>

      {apiError && (
        <ErrorAlert
          title={apiError.title}
          detail={apiError.detail}
          sql={apiError.sql}
          status={apiError.status}
          onRetry={() => executeSearch(userQuery)}
          onDismiss={() => setApiError(null)}
        />
      )}

      {result?.sql && <SqlCodeViewer sql={result.sql} />}
      
      {result?.executed && <ResultTable executed={result.executed} />}

      <ToastContainer position="top-right" autoClose={5000} />
    </main>
  );
}

export default App;
