import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.spec.ts',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    webServer: [
        {
            command: 'NEXT_DIST_DIR=.next-chromium DATABASE_NAME=jobmanager_e2e_tests_chromium PORT=3001 npm run build && NEXT_DIST_DIR=.next-chromium DATABASE_NAME=jobmanager_e2e_tests_chromium PORT=3001 npm start -- -p 3001',
            url: 'http://localhost:3001',
            reuseExistingServer: !process.env.CI,
            timeout: 300_000,
        },
        {
            command: 'NEXT_DIST_DIR=.next-firefox DATABASE_NAME=jobmanager_e2e_tests_firefox PORT=3002 npm run build && NEXT_DIST_DIR=.next-firefox DATABASE_NAME=jobmanager_e2e_tests_firefox PORT=3002 npm start -- -p 3002',
            url: 'http://localhost:3002',
            reuseExistingServer: !process.env.CI,
            timeout: 300_000,
        },
        {
            command: 'NEXT_DIST_DIR=.next-webkit DATABASE_NAME=jobmanager_e2e_tests_webkit PORT=3003 npm run build && NEXT_DIST_DIR=.next-webkit DATABASE_NAME=jobmanager_e2e_tests_webkit PORT=3003 npm start -- -p 3003',
            url: 'http://localhost:3003',
            reuseExistingServer: !process.env.CI,
            timeout: 300_000,
        },
    ],
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'], baseURL: 'http://localhost:3002' } },
        { name: 'webkit', use: { ...devices['Desktop Safari'], baseURL: 'http://localhost:3003' } },
    ],
});
