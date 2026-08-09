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

function jwksUrl(supabaseUrl: string): URL {
  return new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
}

export function createJwtVerifier(config: ApiConfig) {
  const jwks = config.supabaseUrl
    ? jose.createRemoteJWKSet(jwksUrl(config.supabaseUrl))
    : null;

  return async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return await reply.status(401).send({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing bearer token', retryable: false },
      });
    }

    const token = header.slice('Bearer '.length);
    let payload: jose.JWTPayload;

    try {
      if (jwks) {
        ({ payload } = await jose.jwtVerify(token, jwks));
      } else if (config.supabaseJwtSecret) {
        const secret = new TextEncoder().encode(config.supabaseJwtSecret);
        ({ payload } = await jose.jwtVerify(token, secret, { algorithms: ['HS256'] }));
      } else {
        return await reply.status(503).send({
          ok: false,
          error: {
            code: 'CONFIG',
            message: 'SUPABASE_URL or SUPABASE_JWT_SECRET required',
            retryable: false,
          },
        });
      }
    } catch {
      return await reply.status(401).send({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid token', retryable: false },
      });
    }

    const sub = payload.sub;
    if (!sub) {
      return await reply.status(401).send({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid token subject', retryable: false },
      });
    }

    request.authUser = { userId: sub };
  };
}
