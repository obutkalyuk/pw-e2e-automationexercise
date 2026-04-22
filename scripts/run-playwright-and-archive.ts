/// <reference types="node" />

import { spawn } from 'node:child_process';
import path from 'node:path';

import { archiveReports } from './archive-playwright-reports';

export async function runPlaywrightAndArchive(playwrightArguments: string[]): Promise<number> {
  const exitCode = await runPlaywright(playwrightArguments);

  try {
    await archiveReports();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Archiving failed: ${message}`);

    if (exitCode === 0) {
      return 1;
    }
  }

  return exitCode;
}

async function main(): Promise<void> {
  const playwrightArguments = process.argv.slice(2);
  const exitCode = await runPlaywrightAndArchive(playwrightArguments);

  process.exit(exitCode);
}

function runPlaywright(playwrightArguments: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const childProcess = spawn(command, ['playwright', 'test', ...playwrightArguments], {
      cwd: process.cwd(),
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    childProcess.on('error', reject);
    childProcess.on('close', (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }

      resolve(code ?? 1);
    });
  });
}

if (isDirectExecution()) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}

function isDirectExecution(): boolean {
  const executedPath = process.argv[1];

  if (!executedPath) {
    return false;
  }

  return path.resolve(executedPath) === path.resolve(__filename);
}
