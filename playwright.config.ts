import { defineConfig } from '@playwright/test';

if (!/^[a-f0-9]{12}$/.test(process.env.GIBEI_TEST_RUN_ID || '')) throw new Error('Use pnpm test:e2e to launch an isolated test database/server');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.SERVER_URL,
    browserName: 'chromium',
    headless: true,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
});
