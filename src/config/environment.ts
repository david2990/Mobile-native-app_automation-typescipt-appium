import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const asBoolean = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const schema = z.object({
  DEVICE_NAME: z.string().min(1).default('Pixel_API_35'),
  DEVICE_UDID: z.string().min(1).optional(),
  PLATFORM_VERSION: z.string().min(1).default('15'),

  APP_PATH: z.string().min(1).default('apps/app-under-test.apk'),
  APP_PACKAGE: z.string().min(1).optional(),
  APP_ACTIVITY: z.string().min(1).optional(),
  NO_RESET: asBoolean,

  APPIUM_HOST: z.string().min(1).default('127.0.0.1'),
  APPIUM_PORT: z.coerce.number().int().positive().default(4723),

  EXPLICIT_WAIT_MS: z.coerce.number().int().positive().default(15_000),
  MAX_INSTANCES: z.coerce.number().int().positive().default(1),

  CI: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}\nSee .env.example`);
}

export const env = parsed.data;

/** Absolute path to the .apk under test. */
export const appPath = path.resolve(env.APP_PATH);

/** True when running inside CI (set CI=true). */
export const isCI = Boolean(env.CI);
