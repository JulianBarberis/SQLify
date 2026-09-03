import axios from 'axios';
import type { DataResponseModel } from '../models/data-response.model';
import type { RequestModel } from '../models/request.model';
import { parseApiError } from '../clases/error-parser';

export const getBaseUrl = (): string => {
  return import.meta.env.VITE_APP_API_URL || 'http://localhost:3001';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function testingAPI(signal?: AbortSignal): Promise<DataResponseModel> {
  try {
    const { data } = await api.get('/api', { signal });
    return data;
  } catch (err: unknown) {
    const error = parseApiError(err);
    console.error('Error al probar API:', error.title);
    throw error;
  }
}

export async function sendRequest(question: string, signal?: AbortSignal): Promise<DataResponseModel> {
  const request: RequestModel = { question, run: true };
  const { data } = await api.post<DataResponseModel>('/api/generar-consulta', request, { signal });
  return data;
}
