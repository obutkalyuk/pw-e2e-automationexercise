/// <reference types="node" />

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type PlaywrightError = {
  message?: string;
};

type PlaywrightResult = {
  error?: PlaywrightError;
  errors?: PlaywrightError[];
  status?: string;
};

type PlaywrightTest = {
  expectedStatus?: string;
  projectName?: string;
  results?: PlaywrightResult[];
  status?: string;
};

type PlaywrightSpec = {
  line?: number;
  specs?: PlaywrightSpec[];
  tests?: PlaywrightTest[];
  title?: string;
};

type PlaywrightSuite = {
  file?: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
  title?: string;
};

type PlaywrightReport = {
  suites: PlaywrightSuite[];
};

type FailedTest = {
  error: string;
  failedAttempts: number;
  file: string;
  line: number | undefined;
  project: string;
  title: string;
};

const DEFAULT_MARKDOWN_OUTPUT_FILE = 'failed-tests-summary.md';
const DEFAULT_HTML_OUTPUT_FILE = 'failed-tests-summary.html';
const MAX_ERROR_LENGTH = 140;

async function main(): Promise<void> {
  const { jsonFilePath, outputDirectoryPath } = parseArguments(process.argv.slice(2));
  const report = await readPlaywrightReport(jsonFilePath);
  const failedTests = collectFailedTests(report.suites);
  const markdown = buildMarkdown(failedTests);
  const html = buildHtml(failedTests);

  await mkdir(outputDirectoryPath, { recursive: true });
  await writeFile(
    path.join(outputDirectoryPath, DEFAULT_MARKDOWN_OUTPUT_FILE),
    `${markdown}\n`,
    'utf8',
  );
  await writeFile(path.join(outputDirectoryPath, DEFAULT_HTML_OUTPUT_FILE), `${html}\n`, 'utf8');
  await writeGithubOutputs({ count: String(failedTests.length), html, markdown });

  console.log(`Found ${failedTests.length} failed test(s).`);
}

function parseArguments(args: string[]): { jsonFilePath: string; outputDirectoryPath: string } {
  const jsonFilePath = args[0];

  if (!jsonFilePath) {
    console.error(
      'Usage: npx tsx scripts/playwright-failed-tests-summary.ts <test-results.json> [--output-dir <directory>]',
    );
    process.exit(1);
  }

  const outputDirectoryIndex = args.indexOf('--output-dir');
  const outputDirectoryPath =
    outputDirectoryIndex >= 0 ? args[outputDirectoryIndex + 1] : process.cwd();

  if (!outputDirectoryPath) {
    console.error('Missing value for --output-dir');
    process.exit(1);
  }

  return {
    jsonFilePath: path.resolve(jsonFilePath),
    outputDirectoryPath: path.resolve(outputDirectoryPath),
  };
}

async function readPlaywrightReport(jsonFilePath: string): Promise<PlaywrightReport> {
  const content = await readFile(jsonFilePath, 'utf8');
  const parsed = JSON.parse(content) as unknown;

  if (!isPlaywrightReport(parsed)) {
    throw new Error(`File is not a Playwright JSON report: ${jsonFilePath}`);
  }

  return parsed;
}

function collectFailedTests(suites: PlaywrightSuite[]): FailedTest[] {
  const failedTests: FailedTest[] = [];

  for (const suite of suites) {
    failedTests.push(...collectFailedTestsFromSuite(suite, []));
  }

  return deduplicateFailedTests(failedTests).sort((left, right) => {
    const byProject = left.project.localeCompare(right.project);

    if (byProject !== 0) {
      return byProject;
    }

    return left.title.localeCompare(right.title);
  });
}

function collectFailedTestsFromSuite(
  suite: PlaywrightSuite,
  ancestorTitles: string[],
): FailedTest[] {
  const failedTests: FailedTest[] = [];
  const nextAncestorTitles = [...ancestorTitles, ...buildSuiteTitleParts(suite.title)];

  for (const spec of suite.specs ?? []) {
    const title = buildTestTitle(nextAncestorTitles, spec.title);

    if (!title) {
      continue;
    }

    for (const test of spec.tests ?? []) {
      if (!isFinalFailure(test)) {
        continue;
      }

      failedTests.push({
        error: extractLastFailureError(test),
        failedAttempts: countFailedAttempts(test),
        file: normalizeFilePath(suite.file),
        line: spec.line,
        project: test.projectName?.trim() || 'unknown',
        title,
      });
    }
  }

  for (const nestedSuite of suite.suites ?? []) {
    failedTests.push(...collectFailedTestsFromSuite(nestedSuite, nextAncestorTitles));
  }

  return failedTests;
}

function buildSuiteTitleParts(suiteTitle: string | undefined): string[] {
  const trimmedTitle = suiteTitle?.trim();

  if (!trimmedTitle) {
    return [];
  }

  if (trimmedTitle.endsWith('.spec.ts') || trimmedTitle.endsWith('.api.spec.ts')) {
    return [];
  }

  return [trimmedTitle];
}

function buildTestTitle(ancestorTitles: string[], specTitle: string | undefined): string {
  const trimmedSpecTitle = specTitle?.trim();

  if (!trimmedSpecTitle) {
    return '';
  }

  return [...ancestorTitles, trimmedSpecTitle].join(' > ');
}

function isFinalFailure(test: PlaywrightTest): boolean {
  if (test.expectedStatus && test.expectedStatus !== 'passed') {
    return false;
  }

  if (test.status === 'unexpected') {
    return true;
  }

  if (test.status && test.status !== 'unexpected') {
    return false;
  }

  const lastResult = test.results?.at(-1);

  return lastResult?.status === 'failed' || lastResult?.status === 'timedOut';
}

function countFailedAttempts(test: PlaywrightTest): number {
  return (test.results ?? []).filter(
    (result) => result.status === 'failed' || result.status === 'timedOut',
  ).length;
}

function extractLastFailureError(test: PlaywrightTest): string {
  const failedResults = (test.results ?? []).filter(
    (result) => result.status === 'failed' || result.status === 'timedOut',
  );
  const lastFailedResult = failedResults.at(-1);
  const messages = [
    lastFailedResult?.error?.message,
    ...(lastFailedResult?.errors ?? []).map((error) => error.message),
  ];
  const message = messages.map(normalizeErrorMessage).find((value) => value.length > 0);

  return truncateForDisplay(message || 'No failure message in report.', MAX_ERROR_LENGTH);
}

function normalizeErrorMessage(message: string | undefined): string {
  return (message ?? '')
    .replace(new RegExp(String.raw`\u001b\[[0-9;]*m`, 'g'), '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^\[[^\]]+\]\s+>/.test(line))
    .filter((line) => !/^at\s/.test(line))
    .filter((line) => !/^\d+\s+\|/.test(line))
    .filter((line) => !/^>\s*\d+\s+\|/.test(line))
    .filter((line) => line !== 'Call log:')
    .slice(0, 2)
    .join(' ');
}

function deduplicateFailedTests(failedTests: FailedTest[]): FailedTest[] {
  const deduplicated = new Map<string, FailedTest>();

  for (const failedTest of failedTests) {
    const key = `${failedTest.project}|||${failedTest.file}|||${failedTest.line ?? ''}|||${failedTest.title}`;
    const existing = deduplicated.get(key);

    if (!existing || failedTest.failedAttempts > existing.failedAttempts) {
      deduplicated.set(key, failedTest);
    }
  }

  return [...deduplicated.values()];
}

function buildMarkdown(failedTests: FailedTest[]): string {
  if (failedTests.length === 0) {
    return '### Failed tests\n\nNo failed tests in the final Playwright results.';
  }

  const lines = [
    `### Failed tests (${failedTests.length})`,
    '',
    '| Project | Test | Location | Failed attempts | Last error |',
    '| --- | --- | --- | ---: | --- |',
  ];

  for (const failedTest of failedTests) {
    lines.push(
      `| ${escapeMarkdownCell(failedTest.project)} | ${escapeMarkdownCell(failedTest.title)} | ${escapeMarkdownCell(buildLocation(failedTest))} | ${failedTest.failedAttempts} | ${escapeMarkdownCell(failedTest.error)} |`,
    );
  }

  return lines.join('\n');
}

function buildHtml(failedTests: FailedTest[]): string {
  if (failedTests.length === 0) {
    return '<h3>Failed Tests</h3><p>No failed tests in the final Playwright results.</p>';
  }

  const rows = failedTests
    .map(
      (failedTest) => `<tr>
  <td>${escapeHtml(failedTest.project)}</td>
  <td>${escapeHtml(failedTest.title)}</td>
  <td><code>${escapeHtml(buildLocation(failedTest))}</code></td>
  <td style="text-align:center">${failedTest.failedAttempts}</td>
  <td>${escapeHtml(failedTest.error)}</td>
</tr>`,
    )
    .join('\n');

  return `<h3>Failed Tests (${failedTests.length})</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
  <tr style="background:#f0f0f0">
    <th>Project</th><th>Test</th><th>Location</th><th>Failed attempts</th><th>Last error</th>
  </tr>
${rows}
</table>`;
}

function buildLocation(failedTest: FailedTest): string {
  return failedTest.line ? `${failedTest.file}:${failedTest.line}` : failedTest.file;
}

function normalizeFilePath(filePath: string | undefined): string {
  return (filePath || 'unknown').replace(/\\/g, '/');
}

function truncateForDisplay(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function writeGithubOutputs(outputs: Record<string, string>): Promise<void> {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    return;
  }

  const lines: string[] = [];

  for (const [name, value] of Object.entries(outputs)) {
    const delimiter = `playwright_failed_tests_${name}_${Date.now()}`;

    lines.push(`${name}<<${delimiter}`, value, delimiter);
  }

  await appendFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function isPlaywrightReport(value: unknown): value is PlaywrightReport {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.suites);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
