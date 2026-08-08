#!/usr/bin/env node
/**
 * Regenerate packages/shared/src/db.types.ts after schema changes.
 *
 * Option A (Cursor): Supabase MCP → generate_typescript_types → save to src/db.types.ts
 * Option B (CLI):    supabase login && supabase gen types typescript --project-id wcwwuegdfdkfnzekifmr > src/db.types.ts
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../src/db.types.ts');
if (!existsSync(out)) {
  console.error(`Missing ${out}. Generate via MCP or supabase CLI (see script header).`);
  process.exit(1);
}
console.log(`Types present: ${out}`);
