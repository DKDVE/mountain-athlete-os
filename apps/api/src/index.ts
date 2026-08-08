import cors from '@fastify/cors';
import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { createJwtVerifier } from './middleware/jwt.js';
import { healthRoutes } from './routes/health.js';

const config = loadConfig();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: config.allowedOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
});

healthRoutes(app);

// JWT middleware registered for future protected routes; not applied to /health
app.addHook('onRequest', async (request, reply) => {
  if (request.url === '/health') return;
  await createJwtVerifier(config)(request, reply);
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
