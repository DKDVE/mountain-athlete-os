import type { FastifyReply, FastifyRequest } from 'fastify';
import * as jose from 'jose';
import type { ApiConfig } from '../config.js';

export interface AuthUser {
  userId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

export function createJwtVerifier(config: ApiConfig) {
  return async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.status(401).send({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing bearer token', retryable: false },
      });
    }

    if (!config.supabaseJwtSecret) {
      return reply.status(503).send({
        ok: false,
        error: {
          code: 'CONFIG',
          message: 'JWT secret not configured',
          retryable: false,
        },
      });
    }

    const token = header.slice('Bearer '.length);
    try {
      const secret = new TextEncoder().encode(config.supabaseJwtSecret);
      const { payload } = await jose.jwtVerify(token, secret, { algorithms: ['HS256'] });
      const sub = payload.sub;
      if (!sub) {
        return await reply.status(401).send({
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid token subject', retryable: false },
        });
      }
      request.authUser = { userId: sub };
    } catch {
      return reply.status(401).send({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid token', retryable: false },
      });
    }
  };
}
