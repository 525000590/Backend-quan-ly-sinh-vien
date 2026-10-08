import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import type { OpenAPIV3 } from 'openapi-types';

const yamlPath = resolve(process.cwd(), 'docs/openapi.yaml');
const value: unknown = load(readFileSync(yamlPath, 'utf8'));

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

if (
  !isObj(value) ||
  value.openapi !== '3.0.3' ||
  !isObj(value.info) ||
  !isObj(value.paths)
) {
  throw new Error('OpenAPI YAML thiếu cấu trúc bắt buộc');
}

export const swaggerSpec = value as unknown as OpenAPIV3.Document;
