#!/usr/bin/env node
/**
 * Start Next.js dev server with test environment
 *
 * Waits for the testcontainer config file to be created by global-setup,
 * then starts Next.js with the test DATABASE_URL
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '.testcontainer-config.json');
const PROJECT_DIR = path.join(__dirname, '..');
const MAX_WAIT_MS = 60000; // Wait up to 60 seconds for config file
const POLL_INTERVAL_MS = 500;

process.stderr.write('[E2E Server] Starting test server...\n');
process.stderr.write('[E2E Server] Waiting for config file: ' + CONFIG_PATH + '\n');

// Wait for config file to be created by global-setup
async function waitForConfig() {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_MS) {
    if (fs.existsSync(CONFIG_PATH)) {
      try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        if (config.connectionUri) {
          process.stderr.write('[E2E Server] ✅ Found config file\n');
          process.stderr.write('[E2E Server] DATABASE_URL: ' + config.connectionUri + '\n');
          return config.connectionUri;
        }
      } catch (err) {
        // File might still be being written
        process.stderr.write('[E2E Server] Config file exists but not ready yet...\n');
      }
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Timeout waiting for config file');
}

async function main() {
  try {
    const databaseUrl = await waitForConfig();

    process.stderr.write('[E2E Server] Starting Next.js with INTEGRATION_TEST_MODE=true\n');

    // Set environment variables explicitly
    const env = {
      ...process.env,
      DATABASE_URL: databaseUrl,
      INTEGRATION_TEST_MODE: 'true',
    };

    // Start Next.js dev server
    const child = spawn('npx', ['next', 'dev'], {
      cwd: PROJECT_DIR,
      env,
      stdio: 'inherit',
    });

    child.on('error', (err) => {
      console.error('[E2E Server] Failed to start dev server:', err);
      process.exit(1);
    });

    child.on('exit', (code) => {
      console.log('[E2E Server] Next.js exited with code:', code);
      process.exit(code || 0);
    });

  } catch (err) {
    process.stderr.write('[E2E Server] ❌ Error: ' + err.message + '\n');
    process.exit(1);
  }
}

main();
