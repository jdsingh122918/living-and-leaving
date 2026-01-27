import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { clerkSetup } from '@clerk/testing/playwright';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { execSync, spawn, ChildProcess } from 'child_process';
import path from 'path';
import http from 'http';

// Store references for cleanup
let mongoContainer: StartedMongoDBContainer;
let nextServer: ChildProcess | null = null;

const CONFIG_PATH = path.join(__dirname, '.testcontainer-config.json');
const PROJECT_DIR = path.join(__dirname, '..');

/**
 * Wait for the Next.js server to be ready
 */
async function waitForServer(url: string, maxWaitMs: number = 60000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else {
            reject(new Error(`Server returned ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      return; // Server is ready
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Timeout waiting for server to be ready');
}

export default async function globalSetup() {
  console.log('\n🚀 Starting E2E Test Setup...\n');

  // Check auth mode
  const useRealClerk = process.env.E2E_USE_REAL_CLERK === 'true';

  try {
    // Setup Clerk testing token only if using real Clerk auth
    if (useRealClerk) {
      console.log('🔐 Setting up Clerk testing token (real auth mode)...');
      await clerkSetup();
      console.log('✅ Clerk testing token configured\n');
    } else {
      console.log('🧪 Using mock authentication mode (Clerk bypass)');
      console.log('   Set E2E_USE_REAL_CLERK=true to use real Clerk auth\n');
    }

    // Start MongoDB container with replica set (required for Prisma transactions)
    console.log('📦 Starting MongoDB container with replica set...');
    mongoContainer = await new MongoDBContainer('mongo:7')
      .withExposedPorts(27017)
      .start();

    // Get connection string and add database name
    const connectionUri = mongoContainer.getConnectionString();
    const testDatabaseUrl = `${connectionUri}/firefly-test?retryWrites=true&w=majority&directConnection=true`;

    console.log(`✅ MongoDB container started`);
    console.log(`   Connection: ${testDatabaseUrl}\n`);

    // Save container info for teardown and tests
    const config = {
      containerId: mongoContainer.getId(),
      connectionUri: testDatabaseUrl,
      host: mongoContainer.getHost(),
      port: mongoContainer.getMappedPort(27017),
    };

    console.log(`📁 Writing config to: ${CONFIG_PATH}`);
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`📁 Config file exists: ${existsSync(CONFIG_PATH)}`);
    console.log(`📁 Config content: ${JSON.stringify(config, null, 2)}`);

    // Write .env.e2e file and update .env.local for Next.js to pick up
    const envE2ePath = path.join(__dirname, '..', '.env.e2e');
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    const envLocalBackupPath = path.join(__dirname, '..', '.env.local.backup');

    // Backup existing .env.local and merge with test vars
    let existingEnvContent = '';
    if (existsSync(envLocalPath)) {
      existingEnvContent = readFileSync(envLocalPath, 'utf-8');
      writeFileSync(envLocalBackupPath, existingEnvContent);
      console.log('📝 Backed up existing .env.local');
    }

    // Parse existing env and replace/add test vars
    const envLines = existingEnvContent.split('\n');
    const newEnvLines: string[] = [];
    let foundDatabaseUrl = false;
    let foundTestMode = false;

    for (const line of envLines) {
      if (line.startsWith('DATABASE_URL=')) {
        newEnvLines.push(`DATABASE_URL="${testDatabaseUrl}"`);
        foundDatabaseUrl = true;
      } else if (line.startsWith('INTEGRATION_TEST_MODE=')) {
        newEnvLines.push('INTEGRATION_TEST_MODE=true');
        foundTestMode = true;
      } else {
        newEnvLines.push(line);
      }
    }

    // Add missing vars
    if (!foundDatabaseUrl) {
      newEnvLines.push(`DATABASE_URL="${testDatabaseUrl}"`);
    }
    if (!foundTestMode) {
      newEnvLines.push('INTEGRATION_TEST_MODE=true');
    }

    const mergedContent = newEnvLines.join('\n');
    writeFileSync(envE2ePath, mergedContent);
    writeFileSync(envLocalPath, mergedContent);
    console.log(`📝 Updated .env.local with test DATABASE_URL`);

    // Verify the write worked
    const verifyContent = readFileSync(envLocalPath, 'utf-8');
    const dbUrlLine = verifyContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
    console.log(`📝 Verified .env.local DATABASE_URL line: ${dbUrlLine}`);

    // Set environment variable for Prisma
    process.env.TEST_DATABASE_URL = testDatabaseUrl;
    process.env.DATABASE_URL = testDatabaseUrl;

    // Run Prisma db push to create schema
    console.log('🔧 Running Prisma db push...');
    execSync(`DATABASE_URL="${testDatabaseUrl}" npx prisma db push --skip-generate`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    console.log('✅ Database schema created\n');

    // Seed test data
    console.log('🌱 Seeding test data...');
    execSync(`DATABASE_URL="${testDatabaseUrl}" npx tsx e2e/utils/seed-test-data.ts`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    console.log('✅ Test data seeded\n');

    // Start Next.js dev server with test DATABASE_URL
    console.log('🚀 Starting Next.js dev server...');

    nextServer = spawn('npx', ['next', 'dev'], {
      cwd: PROJECT_DIR,
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
        INTEGRATION_TEST_MODE: 'true',
      },
      stdio: 'pipe',
    });

    // Store server PID in config for teardown
    const configWithServer = {
      containerId: mongoContainer.getId(),
      connectionUri: testDatabaseUrl,
      host: mongoContainer.getHost(),
      port: mongoContainer.getMappedPort(27017),
      serverPid: nextServer.pid,
    };
    writeFileSync(CONFIG_PATH, JSON.stringify(configWithServer, null, 2));

    // Log server output
    nextServer.stdout?.on('data', (data) => {
      process.stdout.write(`[Next.js] ${data}`);
    });

    nextServer.stderr?.on('data', (data) => {
      process.stderr.write(`[Next.js] ${data}`);
    });

    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await waitForServer('http://localhost:3000', 120000);
    console.log('✅ Next.js server is ready\n');

    console.log('🎉 E2E Test Setup Complete!\n');
    console.log('=' .repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // Clean up server if it was started
    if (nextServer) {
      nextServer.kill();
    }
    throw error;
  }
}
