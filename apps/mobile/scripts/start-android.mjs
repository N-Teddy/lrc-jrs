#!/usr/bin/env node

import { exec, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to parse key=value lines from a .env file
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf8');
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      result[key] = val;
    }
  }
  return result;
}

// Extract port number from an API URL
function extractPort(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.port) return Number.parseInt(parsed.port, 10);
  } catch {
    // If not a full URL, fallback to regex
    const match = urlStr.match(/:(\d+)/);
    if (match?.[1]) return Number.parseInt(match[1], 10);
  }
  return null;
}

// Find all backend ports to reverse
function getTargetPorts() {
  const ports = new Set([3500, 3000]);

  const mobileEnv = parseEnvFile(resolve(__dirname, '../.env'));
  if (mobileEnv.EXPO_PUBLIC_API_URL) {
    const p = extractPort(mobileEnv.EXPO_PUBLIC_API_URL);
    if (p) ports.add(p);
  }

  const serverEnv = parseEnvFile(resolve(__dirname, '../../server/.env'));
  if (serverEnv.PORT) {
    const p = Number.parseInt(serverEnv.PORT, 10);
    if (!Number.isNaN(p)) ports.add(p);
  }

  return Array.from(ports);
}

// Execute a command returning a Promise
function execCommand(cmd) {
  return new Promise((res) => {
    exec(cmd, (err, stdout, stderr) => {
      res({ err, stdout: stdout?.trim() || '', stderr: stderr?.trim() || '' });
    });
  });
}

// Check connected ADB devices
async function getConnectedAdbDevices() {
  const res = await execCommand('adb devices');
  if (res.err) return [];
  const lines = res.stdout.split('\n').slice(1);
  const devices = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2 && parts[1] === 'device') {
      devices.push(parts[0]);
    }
  }
  return devices;
}

// Reverse ports for a specific device or all devices
async function reversePortsForDevice(deviceId, ports) {
  for (const port of ports) {
    const cmd = deviceId
      ? `adb -s ${deviceId} reverse tcp:${port} tcp:${port}`
      : `adb reverse tcp:${port} tcp:${port}`;
    const res = await execCommand(cmd);
    if (!res.err) {
      console.log(
        `\x1b[32m[Android]\x1b[0m Reverse proxy established: device localhost:${port} -> host localhost:${port}${
          deviceId ? ` (${deviceId})` : ''
        }`,
      );
    }
  }
}

async function main() {
  const targetPorts = getTargetPorts();
  console.log(
    `\x1b[36m[Android]\x1b[0m Preparing backend localhost proxy on ports: ${targetPorts.join(', ')}...`,
  );

  const reversedDevices = new Set();

  async function checkAndReverse() {
    const devices = await getConnectedAdbDevices();
    for (const dev of devices) {
      if (!reversedDevices.has(dev)) {
        await reversePortsForDevice(dev, targetPorts);
        reversedDevices.add(dev);
      }
    }
    // Also try generic reverse in case deviceId is not needed
    if (devices.length > 0 && reversedDevices.size === 0) {
      await reversePortsForDevice(null, targetPorts);
    }
  }

  // Attempt initial reverse immediately
  await checkAndReverse();

  // Poll for newly booted emulators or connected USB devices (for 90s)
  let pollCount = 0;
  const pollInterval = setInterval(async () => {
    pollCount++;
    await checkAndReverse();
    if (pollCount > 60) {
      clearInterval(pollInterval);
    }
  }, 1500);

  // Ensure Electron DevTools doesn't crash on Linux due to SUID sandbox
  process.env.ELECTRON_DISABLE_SANDBOX = '1';

  // Check if any connected device has the development build (com.lrc.jrs) installed
  async function hasDevBuildInstalled(packageName = 'com.lrc.jrs') {
    const devices = await getConnectedAdbDevices();
    for (const dev of devices) {
      const res = await execCommand(
        `adb -s ${dev} shell pm list packages ${packageName}`,
      );
      if (res.stdout.includes(`package:${packageName}`)) {
        return { installed: true, deviceId: dev };
      }
    }
    return { installed: false, deviceId: null };
  }

  // Handle dev-client vs Expo Go arguments intelligently
  let extraArgs = process.argv.slice(2);
  const devCheck = await hasDevBuildInstalled('com.lrc.jrs');

  if (extraArgs.includes('--dev-client') && !devCheck.installed) {
    console.log(
      `\x1b[33m[Android]\x1b[0m Development build (com.lrc.jrs) is not installed on connected device. Falling back to Expo Go (--go).`,
    );
    console.log(
      `\x1b[33m[Android]\x1b[0m (Run 'pnpm run android:build' to build and install the native development client APK)\n`,
    );
    extraArgs = extraArgs.filter((arg) => arg !== '--dev-client');
    if (!extraArgs.includes('--go')) {
      extraArgs.push('--go');
    }
  } else if (
    !extraArgs.includes('--dev-client') &&
    !extraArgs.includes('--go')
  ) {
    if (devCheck.installed) {
      extraArgs.push('--dev-client');
    } else {
      extraArgs.push('--go');
    }
  }

  // Spawn expo start --android
  const expoArgs = ['start', '--android', ...extraArgs];

  console.log(
    `\x1b[36m[Android]\x1b[0m Launching: expo ${expoArgs.join(' ')}\n`,
  );

  const expoProc = spawn('npx', ['expo', ...expoArgs], {
    cwd: resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  const cleanup = () => {
    clearInterval(pollInterval);
    if (!expoProc.killed) {
      expoProc.kill('SIGINT');
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  expoProc.on('exit', (code) => {
    clearInterval(pollInterval);
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('[Android] Error running start-android:', err);
  process.exit(1);
});
