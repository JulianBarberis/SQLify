import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
    })),
    isAxiosError: vi.fn((err: any) => Boolean(err?.isAxiosError)),
  },
}));

import { testingAPI, sendRequest, getBaseUrl } from './appService';

describe('appService (service/appService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('testingAPI retorna los datos en caso de éxito', async () => {
    const mockData = { message: 'API saludable' };
    mockGet.mockResolvedValueOnce({ data: mockData });

    const controller = new AbortController();
    const result = await testingAPI(controller.signal);

    expect(mockGet).toHaveBeenCalledWith('/api', { signal: controller.signal });
    expect(result).toEqual(mockData);
  });

  it('testingAPI captura el error, loguea en consola y lanza el error parseado', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const networkError = new Error('Conexión rehusada');
    mockGet.mockRejectedValueOnce(networkError);

    await expect(testingAPI()).rejects.toEqual({
      title: 'Conexión rehusada',
    });
    expect(consoleSpy).toHaveBeenCalledWith('Error al probar API:', 'Conexión rehusada');
  });

  it('sendRequest envía la consulta y retorna la respuesta', async () => {
    const mockResponse = {
      sql: 'SELECT * FROM Artista;',
      explain: 'Generado por Gemini',
      executed: { rowCount: 1, rows: [{ id: 1, nombre: 'Queen' }] },
    };
    mockPost.mockResolvedValueOnce({ data: mockResponse });

    const controller = new AbortController();
    const result = await sendRequest('dame artistas', controller.signal);

    expect(mockPost).toHaveBeenCalledWith(
      '/api/generar-consulta',
      { question: 'dame artistas', run: true },
      { signal: controller.signal }
    );
    expect(result).toEqual(mockResponse);
  });

  it('getBaseUrl retorna VITE_APP_API_URL cuando está configurada y fallback cuando no', () => {
    const origUrl = import.meta.env.VITE_APP_API_URL;

    import.meta.env.VITE_APP_API_URL = 'https://sqlify-api.vercel.app';
    expect(getBaseUrl()).toBe('https://sqlify-api.vercel.app');

    import.meta.env.VITE_APP_API_URL = '';
    expect(getBaseUrl()).toBe('http://localhost:3001');

    import.meta.env.VITE_APP_API_URL = origUrl;
  });
});
