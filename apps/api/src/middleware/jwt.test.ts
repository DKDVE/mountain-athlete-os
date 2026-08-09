import type { FastifyReply, FastifyRequest } from 'fastify';
import { describe, expect, it } from 'vitest';
import { createJwtVerifier } from './jwt.js';

describe('createJwtVerifier', () => {
  it('rejects missing bearer token', async () => {
    const verifier = createJwtVerifier({
      port: 3000,
      allowedOrigin: 'http://localhost:5173',
      supabaseJwtSecret: 'test-secret',
      openrouterApiKey: '',
      openrouterModelDefault: 'openrouter/free',
      openrouterModelPremium: 'deepseek/deepseek-v4-flash',
    });

    const reply = {
      statusCode: 200,
      body: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      send(payload: unknown) {
        this.body = payload;
        return this;
      },
    };

    const request = { headers: {} } as FastifyRequest;

    await verifier(request, reply as unknown as FastifyReply);

    expect(reply.statusCode).toBe(401);
    expect(reply.body).toMatchObject({ ok: false, error: { code: 'UNAUTHORIZED' } });
  });
});
