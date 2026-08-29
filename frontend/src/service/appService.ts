import axios from 'axios';
import type { DataResponseModel } from '../models/data-response.model';
import type { RequestModel } from '../models/request.model';
import { parseApiError } from '../clases/error-parser';

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || 'http://localhost:3001',
});

export async function testingAPI(): Promise<DataResponseModel> {
  try {
    const {data} = await api.get('/api');
    return data;
  } catch (err: unknown) {
    const error = parseApiError(err);
    console.error('Error al probar API:', error.title);
    throw error;
  }
}

export async function sendRequest (question: string): Promise<DataResponseModel> {
  const request: RequestModel = {question, run: true};
  const {data} = await api.post('/api/generar-consulta', request);
  return data;
}
