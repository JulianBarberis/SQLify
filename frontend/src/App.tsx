import './App.css';
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { sendRequest } from './service/appService';
import {ResultTable} from './components/table/resultTable';
import type { DataResponseModel } from './models/data-response.model';
import { parseApiError } from './clases/error-parser';
import logo from './assets/logo-completo.png';
import infoIcon from './assets/info.svg';

function App() {
    const [userQuery, setuserQuery] = useState('');
    const [result, setResult] = useState<DataResponseModel | null>(null);
    const [loading, setLoading] = useState(false);

    const information: string = 'A tener en cuenta: las consultas muy complejas pueden ser generadas de forma erronea, lo que produce un error al correr la query, de ser asi se mostrara unicamente la query.';
  
    async function runQuery(e: React.FormEvent<HTMLFormElement>): Promise<void> {
      e.preventDefault();
      if (userQuery.length === 0){
        toast.error('Por favor ingrese una consulta');
      } else {
        setResult(null);
        setLoading(true);
      
        try {
          // ------ TESTING API ------
          // const response = await testingAPI();
          // toast.success(response.message)
          // ------------
          
          const respose = await sendRequest(userQuery);
          setResult(respose);
          toast.success(respose.explain);
    
        } catch (err) {
          const error = parseApiError(err);
          toast.error(error.title, { autoClose: 8000 });

          if (error.detail) {
            toast.info(error.detail, { autoClose: 10000 });
          }
          if (error.sql) {
            setResult({ sql: error.sql });
          }
        } finally {
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
                <img src={infoIcon} alt="" title={information}/>
              </div>
              <textarea id="askme-input" rows={4} value={userQuery} onChange={e=>setuserQuery(e.target.value)} />
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
