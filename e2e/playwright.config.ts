import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Try to read database URL from testcontainer config (created by global-setup)
const CONFIG_PATH = path.join(__dirname, '.testcontainer-config.json');
let testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';

function getTestDatabaseUrl(): string {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return config.connectionUri || testDatabaseUrl;
    }
  } catch {
    // Config file doesn't exist yet, will be created by global-setup
  }
  return testDatabaseUrl;
}

/**
 * Playwright configuration for Living & Leaving E2E tests
 * Uses Testcontainers for MongoDB and Clerk Testing Mode for auth
 */
export default defineConfig({
  testDir: './tests',

  // Run tests sequentially to share the MongoDB container
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 1,

  // Single worker for Testcontainers shared state
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Timeout for each test
  timeout: 60000,

  // Global setup and teardown for Testcontainers
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  // Shared settings for all projects
  use: {
    // Base URL for the app
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot only on failure
    screenshot: 'only-on-failure',

    // Record video only when retrying
    video: 'on-first-retry',

    // Maximum time to wait for actions
    actionTimeout: 15000,

    // Maximum time to wait for navigations
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to add more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Note: Server is started in global-setup.ts, not here
  // This ensures proper sequencing: MongoDB container -> schema setup -> seeding -> Next.js server

  // Output folder for test artifacts
  outputDir: 'test-results/',

  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
