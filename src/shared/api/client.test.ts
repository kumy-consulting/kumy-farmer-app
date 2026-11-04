import { AxiosError, type AxiosAdapter, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';

import { ApiRequestError, apiClient } from '@/shared/api/client';

const adapterOriginal = apiClient.defaults.adapter;

/** Un adaptateur qui répond comme l'API : status + corps. */
const repondre =
  (status: number, data: unknown): AxiosAdapter =>
  (config) =>
    Promise.reject(
      new AxiosError('échec', 'ERR_BAD_REQUEST', config, null, {
        status,
        data,
        statusText: '',
        headers: {},
        config,
      } as AxiosResponse),
    );

describe('intercepteur de réponse', () => {
  afterEach(() => {
    apiClient.defaults.adapter = adapterOriginal;
  });

  it('porte le code et le corps de l’erreur de l’API', async () => {
    apiClient.defaults.adapter = repondre(409, { code: 'ATTACH_REQUEST_BLOCKED', message: 'm' });

    const err = await apiClient.post('/attach-requests/me/code').catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiRequestError);
    const e = err as ApiRequestError;
    expect(e.status).toBe(409);
    expect(e.code).toBe('ATTACH_REQUEST_BLOCKED');
    expect(e.data?.message).toBe('m');
  });

  it('laisse le code vide quand le corps n’en a pas', async () => {
    apiClient.defaults.adapter = repondre(500, { message: 'boum' });

    const e = (await apiClient.get('/x').catch((x: unknown) => x)) as ApiRequestError;

    expect(e.code).toBeUndefined();
    expect(e.message).toBe('boum');
  });

  it('garde les appels à deux arguments valides', () => {
    const e = new ApiRequestError('m', 400);
    expect(e.code).toBeUndefined();
    expect(e.data).toBeUndefined();
  });
});
