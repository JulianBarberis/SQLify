import './App.css';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { sendRequest } from './service/appService';
import { ResultTable } from './components/table/resultTable';
import type { DataResponseModel } from './models/data-response.model';
import { parseApiError } from './clases/error-parser';
import logo from './assets/logo-completo.png';
import infoIcon from './assets/info.svg';

function App() {
    const [userQuery, setuserQuery] = useState('');
    const [result, setResult] = useState<DataResponseModel | null>(null);
    const [loading, setLoading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const information: string = 'A tener en cuenta: las consultas muy complejas pueden ser generadas de forma errónea, lo que produce un error al correr la query. De ser así, se mostrará únicamente la query.';

    useEffect(() => {
      return () => {
        abortControllerRef.current?.abort();
      };
    }, []);

    async function runQuery(e: React.FormEvent<HTMLFormElement>): Promise<void> {
      e.preventDefault();
      const trimmedQuery = userQuery.trim();
      if (!trimmedQuery) {
        toast.error('Por favor ingrese una consulta');
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setResult(null);
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
        toast.error(error.title, { autoClose: 8000 });

        if (error.detail) {
          toast.info(error.detail, { autoClose: 10000 });
        }
        if (error.sql) {
          setResult({ sql: error.sql });
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
        }
      }
    };
  
    return (
      <main>
        <div className="header"> 
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <div className="container">
          <h1>Traductor a SQL :D</h1>
  
          <div>
            <p>Te ayudamos con la Base de Datos generando las consultas a partir de un lenguaje natural mediante una IA</p>
  
            <form className='form-conatainer' onSubmit={runQuery}>
              <div className='info-container'>
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
                onChange={e=>setuserQuery(e.target.value)}
              />
              <button className='primary-button' type="submit" disabled={loading}>{loading ? 'EJECUTANDO…' : 'BUSCAR'}</button>
              {/* <button type="button" onClick={downloadCsv} disabled={!rows.length}>Exportar CSV</button> */}
            </form>
          </div>
        </div>

        {result?.sql && (<p className="container">{result?.sql}</p>)}
        
        {result?.executed && <ResultTable executed={result?.executed} />}
  
        <ToastContainer position="top-right" autoClose={5000} />
      </main>
    );
}

export default App
