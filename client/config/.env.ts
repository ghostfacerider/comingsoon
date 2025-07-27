import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.[env].local or fallback to .env
const NODE_ENV_RAW = process.env.NODE_ENV || 'development';
const envFile = `.env.${NODE_ENV_RAW}.local`;
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  config({ path: envPath });
  console.log(`✅ Loaded environment from ${envFile}`);
} else {
  config();
  console.warn(`⚠️ ${envFile} not found. Falling back to .env`);
}

// Typed access + parsing
type EnvVarType = 'string' | 'number' | 'boolean';

interface EnvOptions<T extends EnvVarType> {
  type?: T;
  default?: T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : string;
  required?: boolean;
}

function getEnv<T extends EnvVarType>(
  key: string,
  options?: EnvOptions<T>,
): T extends 'number' ? number : T extends 'boolean' ? boolean : string {
  const rawValue = process.env[key];

  if (options?.required && rawValue === undefined) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }

  const value = rawValue ?? options?.default;

  if (value === undefined) {
    throw new Error(
      `❌ Environment variable ${key} is missing and no default was provided.`,
    );
  }

  const type = options?.type ?? 'string';

  switch (type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`❌ ${key} must be a number. Got: "${value}"`);
      }
      return num as any;
    }

    case 'boolean':
      if (value === 'true' || value === true) return true as any;
      if (value === 'false' || value === false) return false as any;
      throw new Error(
        `❌ ${key} must be a boolean (true/false). Got: "${value}"`,
      );

    case 'string':
    default:
      return value.toString() as any;
  }
}

export { getEnv };
