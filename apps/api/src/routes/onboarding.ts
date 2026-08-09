import type { FastifyInstance } from 'fastify';
import { AthleteProfile } from '@maos/shared';
import type { ApiConfig } from '../config.js';
import { apiError, callOpenRouterJson, getUserId } from '../lib/openrouter.js';

function parseBody(raw: unknown): { text: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const text = (raw as { text?: unknown }).text;
  if (typeof text !== 'string' || text.length < 10 || text.length > 8000) return null;
  return { text };
}

/** Minimal JSON schema for OpenRouter structured output (mirrors AthleteProfile). */
const ATHLETE_PROFILE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['goals', 'experience', 'constraints', 'screening', 'preferences', 'metricsSnapshot'],
  properties: {
    goals: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        enum: [
          'fat_loss', 'recomposition', 'hypertrophy', 'strength', 'endurance',
          'hybrid_performance', 'event_specific', 'mobility_pain', 'longevity', 'glp1_preservation',
        ],
      },
    },
    experience: { type: 'string', enum: ['beginner', 'returning', 'intermediate', 'advanced'] },
    constraints: {
      type: 'object',
      additionalProperties: false,
      required: ['daysPerWeek', 'sessionMinutes', 'equipment'],
      properties: {
        daysPerWeek: { type: 'integer', minimum: 1, maximum: 7 },
        sessionMinutes: { type: 'integer', minimum: 20, maximum: 180 },
        equipment: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['barbell', 'dumbbell', 'rack', 'bench', 'pull_up_bar', 'cable', 'machine', 'band', 'bodyweight', 'treadmill', 'outdoor'],
          },
        },
        schedule: { type: 'string' },
      },
    },
    screening: {
      type: 'object',
      additionalProperties: false,
      required: ['flags'],
      properties: {
        flags: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['flag'],
            properties: {
              flag: {
                type: 'string',
                enum: ['cardiac', 'metabolic', 'renal', 'pregnancy', 'current_injury', 'recent_surgery', 'uncontrolled_bp', 'chronic_condition_other'],
              },
              region: { type: 'string' },
              note: { type: 'string' },
            },
          },
        },
      },
    },
    preferences: {
      type: 'object',
      additionalProperties: false,
      required: ['likedMovements', 'dislikedMovements'],
      properties: {
        likedMovements: { type: 'array', items: { type: 'string' } },
        dislikedMovements: { type: 'array', items: { type: 'string' } },
        dietaryPattern: { type: ['string', 'null'] },
        wearableOwned: { type: ['string', 'null'] },
      },
    },
    metricsSnapshot: {
      type: 'object',
      additionalProperties: false,
      properties: {
        heightCm: { type: ['number', 'null'] },
        weightKg: { type: ['number', 'null'] },
        waistCm: { type: ['number', 'null'] },
      },
    },
  },
};

const SYSTEM_PROMPT = `You extract structured athlete onboarding data for a mountain hybrid training app.
Return JSON matching the schema. Rank goals by priority (first = primary).
Infer reasonable defaults for missing fields. Use metric units (kg, cm).
Equipment enum values: barbell, dumbbell, rack, bench, pull_up_bar, cable, machine, band, bodyweight, treadmill, outdoor.
Map injury mentions to screening flag current_injury with a region (shoulder, lowBack, knee, etc).`;

export function onboardingRoutes(app: FastifyInstance, config: ApiConfig) {
  app.post('/onboarding/parse-profile', async (request, reply) => {
    if (!getUserId(request)) {
      return apiError(reply, 'UNAUTHORIZED', 'Missing or invalid token', false, 401);
    }

    const body = parseBody(request.body);
    if (!body) {
      return apiError(reply, 'VALIDATION', 'Invalid request body', false);
    }

    const result = await callOpenRouterJson(
      config,
      {
        model: config.openrouterModelPremium,
        schemaName: 'AthleteProfile',
        jsonSchema: ATHLETE_PROFILE_JSON_SCHEMA,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: body.text },
        ],
      },
      (raw) => AthleteProfile.parse(raw),
    );

    if (!result.ok) {
      return apiError(reply, result.code, result.message, result.retryable);
    }

    return { ok: true, data: { profile: result.data } };
  });
}
