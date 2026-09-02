import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { parseApiError } from './error-parser';

describe('parseApiError (clases/error-parser.ts)', () => {
  it('parsea AxiosError con data.error, detail, sql y status', () => {
    const fakeAxiosError = {
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          error: 'permiso-denegado',
          detail: 'No tienes permisos suficientes',
          sql: 'DROP TABLE Usuario;',
        },
      },
    };
    // Mock isAxiosError
    const spy = vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const parsed = parseApiError(fakeAxiosError);

    expect(parsed).toEqual({
      title: 'permiso-denegado',
      detail: 'No tienes permisos suficientes',
      sql: 'DROP TABLE Usuario;',
      status: 403,
    });
    spy.mockRestore();
  });

  it('parsea AxiosError con data.message si falta data.error', () => {
    const fakeAxiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          message: 'Error de validación en request',
        },
      },
    };
    const spy = vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const parsed = parseApiError(fakeAxiosError);
    expect(parsed.title).toBe('Error de validación en request');
    expect(parsed.status).toBe(400);
    spy.mockRestore();
  });

  it('parsea AxiosError usando aerr.message cuando data está vacío', () => {
    const fakeAxiosError = {
      isAxiosError: true,
      message: 'Network Error',
      response: undefined,
    };
    const spy = vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const parsed = parseApiError(fakeAxiosError);
    expect(parsed.title).toBe('Network Error');
    expect(parsed.status).toBeUndefined();
    spy.mockRestore();
  });

  it('parsea AxiosError usando fallback "Error de red" cuando no hay mensajes', () => {
    const fakeAxiosError = {
      isAxiosError: true,
      message: '',
      response: undefined,
    };
    const spy = vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const parsed = parseApiError(fakeAxiosError);
    expect(parsed.title).toBe('Error de red');
    spy.mockRestore();
  });

  it('parsea instancia de Error estándar con y sin mensaje', () => {
    const errWithMessage = new Error('Fallo en aplicación');
    expect(parseApiError(errWithMessage)).toEqual({ title: 'Fallo en aplicación' });

    const errWithoutMessage = new Error('');
    expect(parseApiError(errWithoutMessage)).toEqual({ title: 'Error desconocido' });
  });

  it('parsea valores arbitrarios convirtiéndolos a JSON', () => {
    expect(parseApiError({ codigo: 500, detalle: 'fallo' })).toEqual({
      title: '{"codigo":500,"detalle":"fallo"}',
    });
    expect(parseApiError('error en texto plano')).toEqual({
      title: '"error en texto plano"',
    });
  });

  it('parsea objetos con referencias circulares usando String() en el bloque catch', () => {
    const circularObj: any = { name: 'circular' };
    circularObj.self = circularObj;

    const parsed = parseApiError(circularObj);
    expect(parsed.title).toBe('[object Object]');
  });
});
