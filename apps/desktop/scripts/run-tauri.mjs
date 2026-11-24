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

// MinGW / GCC paths
const mingwBin = 'D:\\mingw\\mingw64\\bin';
const mingwLib = 'D:\\mingw\\mingw64\\lib';
const mingwGccLib = 'D:\\mingw\\mingw64\\lib\\gcc\\x86_64-w64-mingw32\\16.2.0';

const env = { ...process.env };
env.CARGO_TARGET_DIR = 'D:\\cargo-target';
env.WEBKIT_DISABLE_DMABUF_RENDERER = '1';
env.WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS = '1';

const libPaths = [mingwGccLib, mingwLib].filter((p) => fs.existsSync(p));
if (libPaths.length > 0) {
  env.LIBRARY_PATH = [...libPaths, env.LIBRARY_PATH].filter(Boolean).join(path.delimiter);
}

const extraPaths = [cargoBin, mingwBin].filter((p) => fs.existsSync(p));
if (extraPaths.length > 0) {
  // Put D:\mingw\mingw64\bin ahead of PATH so genuine GNU GCC is used instead of LLVM-MinGW clang wrapper
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

