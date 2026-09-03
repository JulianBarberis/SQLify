import axios, { AxiosError } from 'axios';

export type ErrorResponseModel = {
  error?: string;
  detail?: string;
  message?: string;
  sql?: string;
}

export function parseApiError(err: unknown): {
  title: string;
  detail?: string;
  sql?: string;
  status?: number;
} {

  // AxiosError con payload tipado
  if (axios.isAxiosError(err)) {
    const aerr = err as AxiosError<ErrorResponseModel>;
    const data = aerr.response?.data;
    const status = aerr.response?.status;

    const title =
      data?.error ||
      data?.message ||
      aerr.message ||
      'Error de red';

    return { title, detail: data?.detail, sql: data?.sql, status };
  }

  // Error nativo
  if (err instanceof Error) {
    return { title: err.message || 'Error desconocido' };
  }

  // Cualquier otra cosa
  try {
    return { title: JSON.stringify(err) };
  } catch {
    return { title: String(err) };
  }
}
