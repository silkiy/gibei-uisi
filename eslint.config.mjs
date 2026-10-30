import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores(['.next/**', '.next-test/**', 'test-results/**', 'playwright-report/**', 'out/**', 'dist/**', '.tools/**', '.pnpm-store/**', 'storage/**', 'media/**', '.obsidian/**', 'artifacts/**', 'next-env.d.ts']),
]);
