import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiConfig } from '../config.js';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterOptions {
  model: string;
  messages: OpenRouterMessage[];
  jsonSchema: Record<string, unknown>;
  schemaName: string;
}

export async function callOpenRouterJson<T>(
  config: ApiConfig,
  options: OpenRouterOptions,
  parse: (raw: unknown) => T,
): Promise<{ ok: true; data: T } | { ok: false; code: string; message: string; retryable: boolean }> {
  if (!config.openrouterApiKey) {
    return { ok: false, code: 'AI_UNAVAILABLE', message: 'OpenRouter not configured', retryable: true };
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/dkdve/mountain-athlete-os',
      'X-Title': 'MAOS',
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: options.schemaName,
          strict: true,
          schema: options.jsonSchema,
        },
      },
    }),
  });

  if (!res.ok) {
    return {
      ok: false,
      code: 'AI_UNAVAILABLE',
      message: `OpenRouter ${String(res.status)}`,
      retryable: res.status >= 500 || res.status === 429,
    };
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, code: 'AI_SCHEMA', message: 'Empty model response', retryable: true };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { ok: false, code: 'AI_SCHEMA', message: 'Invalid JSON from model', retryable: true };
  }

  try {
    return { ok: true, data: parse(parsed) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Schema validation failed';
    return { ok: false, code: 'AI_SCHEMA', message, retryable: true };
  }
}

export function apiError(
  reply: FastifyReply,
  code: string,
  message: string,
  retryable: boolean,
  status = 400,
) {
  return reply.status(status).send({ ok: false, error: { code, message, retryable } });
}

export function getUserId(request: FastifyRequest): string | null {
  const sub = (request as FastifyRequest & { user?: { sub?: string } }).user?.sub;
  return typeof sub === 'string' ? sub : null;
}
