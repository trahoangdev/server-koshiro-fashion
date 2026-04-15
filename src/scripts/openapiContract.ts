import fs from 'fs/promises';
import path from 'path';
import { swaggerSpec } from '../config/swagger';

type OpenApiSpec = {
  openapi?: string;
  info?: unknown;
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
};

const spec = swaggerSpec as OpenApiSpec;

const assertOpenApiContract = (): void => {
  if (!spec.openapi?.startsWith('3.')) {
    throw new Error('OpenAPI contract must be version 3.x');
  }

  if (!spec.info) {
    throw new Error('OpenAPI contract is missing info');
  }

  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    throw new Error('OpenAPI contract has no paths');
  }

  const requiredSchemas = ['Error', 'User', 'Product', 'Order', 'LoginRequest', 'AuthResponse'];
  const schemas = spec.components?.schemas || {};
  const missingSchemas = requiredSchemas.filter((name) => !schemas[name]);

  if (missingSchemas.length > 0) {
    throw new Error(`OpenAPI contract is missing schemas: ${missingSchemas.join(', ')}`);
  }
};

const exportOpenApiContract = async (): Promise<void> => {
  const outputPath = path.resolve(process.cwd(), 'openapi.json');
  await fs.writeFile(outputPath, `${JSON.stringify(swaggerSpec, null, 2)}\n`, 'utf8');
  console.log(`OpenAPI contract exported to ${outputPath}`);
};

const main = async (): Promise<void> => {
  assertOpenApiContract();

  if (process.argv.includes('--export')) {
    await exportOpenApiContract();
    return;
  }

  console.log('OpenAPI contract check passed');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
