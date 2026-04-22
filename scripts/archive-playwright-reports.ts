/// <reference types="node" />

import { constants } from 'node:fs';
import { access, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

type ReportDefinition = {
  fileName: string;
  label: string;
};

const REPORT_DEFINITIONS: ReportDefinition[] = [
  { fileName: 'results.xml', label: 'JUnit XML' },
  { fileName: 'test-results.json', label: 'Playwright JSON' },
];

export async function archiveReports(projectRoot: string = process.cwd()): Promise<string> {
  const timestamp = buildTimestamp(new Date());
  const historyDirectoryPath = path.join(projectRoot, 'artifacts', 'history', timestamp);

  await mkdir(historyDirectoryPath, { recursive: true });

  let copiedReportsCount = 0;

  for (const reportDefinition of REPORT_DEFINITIONS) {
    const sourcePath = path.join(projectRoot, reportDefinition.fileName);
    const exists = await fileExists(sourcePath);

    if (!exists) {
      console.warn(`Skipped ${reportDefinition.label}: ${sourcePath} was not found.`);
      continue;
    }

    const targetPath = path.join(historyDirectoryPath, reportDefinition.fileName);

    await copyFile(sourcePath, targetPath);
    copiedReportsCount += 1;
    console.log(`Archived ${reportDefinition.label} to ${targetPath}`);
  }

  if (copiedReportsCount === 0) {
    throw new Error('No Playwright report files were found to archive.');
  }

  console.log(`Archive ready: ${historyDirectoryPath}`);
  return historyDirectoryPath;
}

async function main(): Promise<void> {
  await archiveReports();
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function buildTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  const hours = padNumber(date.getHours());
  const minutes = padNumber(date.getMinutes());
  const seconds = padNumber(date.getSeconds());
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${milliseconds}`;
}

function padNumber(value: number): string {
  return String(value).padStart(2, '0');
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
