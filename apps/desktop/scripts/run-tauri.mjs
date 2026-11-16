import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopRoot = path.resolve(__dirname, '..');

const home = os.homedir();
const cargoBin = path.join(home, '.cargo', 'bin');
const cargoLib = path.join(home, '.cargo', 'lib');

// Locate LLVM-MinGW bin if present
const wingetPackages = path.join(home, 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
let llvmBin = '';
if (fs.existsSync(wingetPackages)) {
  try {
    const dirs = fs.readdirSync(wingetPackages);
    for (const dir of dirs) {
      if (dir.includes('LLVM-MinGW')) {
        const candidate = path.join(wingetPackages, dir, 'llvm-mingw-20261020-ucrt-x86_64', 'bin');
        if (fs.existsSync(candidate)) {
          llvmBin = candidate;
          break;
        }
        const directBin = path.join(wingetPackages, dir, 'bin');
        if (fs.existsSync(directBin)) {
          llvmBin = directBin;
          break;
        }
      }
    }
  } catch {}
}

const env = { ...process.env };
env.WEBKIT_DISABLE_DMABUF_RENDERER = '1';
env.WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS = '1';

if (fs.existsSync(cargoLib)) {
  env.LIBRARY_PATH = [cargoLib, env.LIBRARY_PATH].filter(Boolean).join(path.delimiter);
}

const extraPaths = [cargoBin, llvmBin].filter((p) => p && fs.existsSync(p));
if (extraPaths.length > 0) {
  env.PATH = [...extraPaths, env.PATH].filter(Boolean).join(path.delimiter);
}

const localTauriBin = path.join(
  desktopRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tauri.cmd' : 'tauri'
);
const tauriCmd = fs.existsSync(localTauriBin) ? localTauriBin : 'tauri';

const args = process.argv.slice(2);

const child = spawn(tauriCmd, args, {
  cwd: desktopRoot,
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('Failed to start tauri:', err);
  process.exit(1);
});

