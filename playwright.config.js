import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' }
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' }
    }
  ],
  webServer: {
    command: 'bun run dev',
    port: 5173,
    timeout: 120000
  },
  reporter: [['html', { open: 'never' }], ['list']]
})
