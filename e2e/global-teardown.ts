import { readFileSync, unlinkSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '.testcontainer-config.json');
const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');
const ENV_LOCAL_BACKUP_PATH = path.join(__dirname, '..', '.env.local.backup');
const ENV_E2E_PATH = path.join(__dirname, '..', '.env.e2e');

/**
 * Check if a process is still running
 */
function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0); // Signal 0 just checks if process exists
    return true;
  } catch {
    return false;
  }
}

/**
 * Kill a process with SIGTERM, then SIGKILL if needed
 */
async function killProcessGracefully(pid: number, name: string): Promise<void> {
  console.log(`🛑 Stopping ${name} (PID: ${pid})...`);

  try {
    // First try SIGTERM for graceful shutdown
    process.kill(pid, 'SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if process is still running
    if (isProcessRunning(pid)) {
      console.warn(`⚠️ ${name} still running after SIGTERM, sending SIGKILL...`);
      process.kill(pid, 'SIGKILL');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isProcessRunning(pid)) {
        console.error(`❌ Failed to kill ${name} (PID: ${pid})`);
      } else {
        console.log(`✅ ${name} force-stopped with SIGKILL`);
      }
    } else {
      console.log(`✅ ${name} stopped gracefully`);
    }
  } catch (err: any) {
    if (err.code === 'ESRCH') {
      // Process already dead, which is fine
      console.log(`✅ ${name} already stopped`);
    } else {
      console.warn(`⚠️ Could not stop ${name}:`, err.message);
    }
  }
}

/**
 * Attempt to stop Docker container as fallback
 */
function tryStopContainer(containerId: string): void {
  try {
    const shortId = containerId.substring(0, 12);
    console.log(`🐳 Attempting to stop container ${shortId}...`);
    execSync(`docker stop ${shortId}`, { timeout: 10000, stdio: 'pipe' });
    console.log(`✅ Container ${shortId} stopped`);
  } catch {
    // Container may already be stopped by Ryuk or doesn't exist
    // This is expected behavior, so we don't log an error
  }
}

export default async function globalTeardown() {
  console.log('\n🧹 Starting E2E Test Teardown...\n');

  try {
    if (existsSync(CONFIG_PATH)) {
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      console.log(`📦 Container ${config.containerId.substring(0, 12)} will be cleaned up by Testcontainers`);

      // Kill Next.js server with robust fallback
      if (config.serverPid) {
        await killProcessGracefully(config.serverPid, 'Next.js server');
      }

      // Fallback: try to stop container explicitly if Ryuk might fail
      if (config.containerId) {
        tryStopContainer(config.containerId);
      }

      // Remove config file
      unlinkSync(CONFIG_PATH);
      console.log('✅ Config file removed');
    }

    // Remove .env.e2e file
    if (existsSync(ENV_E2E_PATH)) {
      unlinkSync(ENV_E2E_PATH);
      console.log('✅ .env.e2e removed');
    }

    // Restore original .env.local from backup
    if (existsSync(ENV_LOCAL_BACKUP_PATH)) {
      const backupContent = readFileSync(ENV_LOCAL_BACKUP_PATH, 'utf-8');
      const { writeFileSync } = await import('fs');
      writeFileSync(ENV_LOCAL_PATH, backupContent);
      unlinkSync(ENV_LOCAL_BACKUP_PATH);
      console.log('✅ .env.local restored from backup');
    } else if (existsSync(ENV_LOCAL_PATH)) {
      // No backup means we created a new .env.local, remove it
      unlinkSync(ENV_LOCAL_PATH);
      console.log('✅ .env.local removed');
    }

    // Testcontainers automatically cleans up containers via Ryuk
    // No need to explicitly stop the container

    console.log('\n🎉 E2E Test Teardown Complete!\n');
  } catch (error) {
    console.error('⚠️ Teardown warning:', error);
    // Don't throw - teardown errors shouldn't fail the test run
  }
}
