import type { FastifyInstance } from 'fastify';

const startedAt = Date.now();

export function healthRoutes(app: FastifyInstance) {
  app.get('/health', () => ({
    ok: true,
    data: { uptime: Math.floor((Date.now() - startedAt) / 1000) },
  }));
}
