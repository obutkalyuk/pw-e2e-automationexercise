/// <reference types="node" />

import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { XMLParser } from 'fast-xml-parser';

type FailureStatus = 'failed' | 'timedOut';

type FailureRecord = {
  browser: string;
  errorSignature: string;
  testName: string;
};

type GroupedFailureRecord = FailureRecord & {
  count: number;
};

type PlaywrightError = {
  message?: string;
};

type PlaywrightResult = {
  duration?: number;
  error?: PlaywrightError;
  errors?: PlaywrightError[];
  retry?: number;
  status?: string;
};

type PlaywrightTest = {
  expectedStatus?: string;
  projectName?: string;
  results?: PlaywrightResult[];
  status?: string;
};

type PlaywrightSpec = {
  tests?: PlaywrightTest[];
  title?: string;
};

type PlaywrightSuite = {
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
  title?: string;
};

type PlaywrightReport = {
  suites: PlaywrightSuite[];
};

type JUnitFailureNode = {
  '@_message'?: string;
  '#text'?: string;
};

type JUnitTestCase = {
  '@_name'?: string;
  failure?: JUnitFailureNode | JUnitFailureNode[] | string | string[];
};

type JUnitTestSuite = {
  '@_hostname'?: string;
  '@_name'?: string;
  testcase?: JUnitTestCase | JUnitTestCase[];
  testsuite?: JUnitTestSuite | JUnitTestSuite[];
};

type JUnitTestSuites = {
  testsuite?: JUnitTestSuite | JUnitTestSuite[];
};

type JUnitDocument = {
  testsuite?: JUnitTestSuite | JUnitTestSuite[];
  testsuites?: JUnitTestSuites;
};

const MAX_GROUPING_SIGNATURE_LENGTH = 120;
const MAX_TABLE_SIGNATURE_LENGTH = 60;
const OUTPUT_FILE_NAME = 'playwright-failure-summary.md';
const FAILURE_STATUSES = new Set<FailureStatus>(['failed', 'timedOut']);
const KNOWN_PROJECT_NAMES = new Set(['api', 'monitoring', 'chromium', 'firefox', 'webkit']);
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: false,
});

async function main(): Promise<void> {
  const directoryPath = process.argv[2];

  if (!directoryPath) {
    console.error('Usage: npx tsx scripts/playwright-failure-parser.ts <directory>');
    process.exit(1);
  }

  const resolvedDirectoryPath = path.resolve(directoryPath);

  if (!existsSync(resolvedDirectoryPath)) {
    console.error(`Directory does not exist: ${resolvedDirectoryPath}`);
    process.exit(1);
  }

  const directoryExists = await readDirectorySafely(resolvedDirectoryPath);

  if (directoryExists === null) {
    console.error(`Directory does not exist: ${resolvedDirectoryPath}`);
    process.exit(1);
  }

  const failures: FailureRecord[] = [];
  const reportGroups = await collectReportGroups(resolvedDirectoryPath);

  for (const reportGroup of reportGroups) {
    failures.push(...(await parseReportGroup(reportGroup)));
  }

  const groupedFailures = groupFailures(failures);
  const markdownTable = buildMarkdownTable(groupedFailures);
  const outputFilePath = path.join(resolvedDirectoryPath, OUTPUT_FILE_NAME);

  console.log(markdownTable);
  await writeFile(outputFilePath, `${markdownTable}\n`, 'utf8');
  console.log(`Saved report to ${outputFilePath}`);
}

async function readDirectorySafely(directoryPath: string): Promise<true | null> {
  try {
    await readdir(directoryPath);
    return true;
  } catch {
    return null;
  }
}

type ReportGroup = {
  directoryPath: string;
  jsonFilePaths: string[];
  xmlFilePaths: string[];
};

type ParsedFailuresResult = {
  failures: FailureRecord[];
  recognizedReport: boolean;
};

async function collectReportGroups(directoryPath: string): Promise<ReportGroup[]> {
  const groups: ReportGroup[] = [];
  const directoryFilePaths: string[] = [];
  const entries = await readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      groups.push(...(await collectReportGroups(entryPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (extension === '.json' || extension === '.xml') {
      directoryFilePaths.push(entryPath);
    }
  }

  if (directoryFilePaths.length > 0) {
    const sortedFilePaths = [...directoryFilePaths].sort((left, right) => left.localeCompare(right));

    groups.push({
      directoryPath,
      jsonFilePaths: sortedFilePaths.filter((filePath) => path.extname(filePath).toLowerCase() === '.json'),
      xmlFilePaths: sortedFilePaths.filter((filePath) => path.extname(filePath).toLowerCase() === '.xml'),
    });
  }

  return groups.sort((left, right) => left.directoryPath.localeCompare(right.directoryPath));
}

async function parseReportGroup(reportGroup: ReportGroup): Promise<FailureRecord[]> {
  const jsonFailures: FailureRecord[] = [];
  let recognizedJsonReport = false;

  for (const jsonFilePath of reportGroup.jsonFilePaths) {
    const parsedJsonResult = await parsePlaywrightJsonFile(jsonFilePath);

    recognizedJsonReport = recognizedJsonReport || parsedJsonResult.recognizedReport;
    jsonFailures.push(...parsedJsonResult.failures);
  }

  if (recognizedJsonReport) {
    return jsonFailures;
  }

  const xmlFailures: FailureRecord[] = [];

  for (const xmlFilePath of reportGroup.xmlFilePaths) {
    const parsedXmlResult = await parseJUnitXmlFile(xmlFilePath);

    if (!parsedXmlResult.recognizedReport) {
      continue;
    }

    xmlFailures.push(...parsedXmlResult.failures);
  }

  return xmlFailures;
}

async function parsePlaywrightJsonFile(filePath: string): Promise<ParsedFailuresResult> {
  try {
    const fileContent = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(fileContent) as unknown;

    if (!isPlaywrightReport(parsed)) {
      return { failures: [], recognizedReport: false };
    }

    return {
      failures: extractPlaywrightFailures(parsed.suites),
      recognizedReport: true,
    };
  } catch (error) {
    console.warn(`Failed to parse JSON file ${filePath}: ${formatError(error)}`);
    return { failures: [], recognizedReport: false };
  }
}

function extractPlaywrightFailures(suites: PlaywrightSuite[]): FailureRecord[] {
  const failures: FailureRecord[] = [];

  for (const suite of suites) {
    failures.push(...extractPlaywrightFailuresFromSuite(suite, []));
  }

  return failures;
}

function extractPlaywrightFailuresFromSuite(
  suite: PlaywrightSuite,
  ancestorTitles: string[],
): FailureRecord[] {
  const failures: FailureRecord[] = [];
  const nextAncestorTitles = [...ancestorTitles, ...buildSuiteTitleParts(suite.title)];

  for (const spec of suite.specs ?? []) {
    const testName = buildPlaywrightTestName(nextAncestorTitles, spec.title);

    if (!testName) {
      continue;
    }

    for (const test of spec.tests ?? []) {
      if (!shouldIncludePlaywrightTest(test)) {
        continue;
      }

      const browser = test.projectName?.trim() || 'unknown';

      for (const result of test.results ?? []) {
        if (!isFailureStatus(result.status)) {
          continue;
        }

        const rawMessage = extractPlaywrightErrorMessage(result);

        failures.push({
          browser,
          errorSignature: simplifyError(rawMessage),
          testName,
        });
      }
    }
  }

  for (const nestedSuite of suite.suites ?? []) {
    failures.push(...extractPlaywrightFailuresFromSuite(nestedSuite, nextAncestorTitles));
  }

  return failures;
}

function buildSuiteTitleParts(suiteTitle: string | undefined): string[] {
  const trimmedTitle = suiteTitle?.trim();

  if (!trimmedTitle) {
    return [];
  }

  if (trimmedTitle.includes('.spec.ts') || trimmedTitle.includes('.api.spec.ts')) {
    return [];
  }

  return [trimmedTitle];
}

function buildPlaywrightTestName(ancestorTitles: string[], specTitle: string | undefined): string {
  const trimmedSpecTitle = specTitle?.trim();

  if (!trimmedSpecTitle) {
    return '';
  }

  return [...ancestorTitles, trimmedSpecTitle].join(' › ');
}

function shouldIncludePlaywrightTest(test: PlaywrightTest): boolean {
  if (test.expectedStatus && test.expectedStatus !== 'passed') {
    return false;
  }

  return test.status === undefined || test.status === 'unexpected' || test.status === 'flaky';
}

function extractPlaywrightErrorMessage(result: PlaywrightResult): string {
  const directMessage = normalizeRawErrorMessage(result.error?.message);

  if (directMessage) {
    return directMessage;
  }

  for (const error of result.errors ?? []) {
    const message = normalizeRawErrorMessage(error.message);

    if (message) {
      return message;
    }
  }

  return result.status ?? 'Unknown Playwright error';
}

async function parseJUnitXmlFile(filePath: string): Promise<ParsedFailuresResult> {
  try {
    const fileContent = await readFile(filePath, 'utf8');
    const parsed = xmlParser.parse(fileContent) as unknown;

    if (!isJUnitDocument(parsed)) {
      return { failures: [], recognizedReport: false };
    }

    return {
      failures: extractJUnitFailures(parsed),
      recognizedReport: true,
    };
  } catch (error) {
    console.warn(`Failed to parse XML file ${filePath}: ${formatError(error)}`);
    return { failures: [], recognizedReport: false };
  }
}

function extractJUnitFailures(document: JUnitDocument): FailureRecord[] {
  const rootSuites = [
    ...toArray(document.testsuites?.testsuite),
    ...toArray(document.testsuite),
  ];
  const failures: FailureRecord[] = [];

  for (const rootSuite of rootSuites) {
    failures.push(...extractJUnitFailuresFromSuite(rootSuite));
  }

  return failures;
}

function extractJUnitFailuresFromSuite(suite: JUnitTestSuite): FailureRecord[] {
  const failures: FailureRecord[] = [];
  const browser = resolveJUnitBrowser(suite);

  for (const testCase of toArray(suite.testcase)) {
    const failureNodes = toArray(testCase.failure);

    if (failureNodes.length === 0) {
      continue;
    }

    const testName = testCase['@_name']?.trim() || 'unknown';

    for (const failureNode of failureNodes) {
      const rawMessage = extractJUnitFailureMessage(failureNode);

      failures.push({
        browser,
        errorSignature: simplifyError(rawMessage),
        testName,
      });
    }
  }

  for (const nestedSuite of toArray(suite.testsuite)) {
    failures.push(...extractJUnitFailuresFromSuite(nestedSuite));
  }

  return failures;
}

function resolveJUnitBrowser(suite: JUnitTestSuite): string {
  const hostname = suite['@_hostname']?.trim().toLowerCase();

  if (hostname && KNOWN_PROJECT_NAMES.has(hostname)) {
    return hostname;
  }

  const suiteName = suite['@_name']?.trim().toLowerCase();

  if (suiteName && KNOWN_PROJECT_NAMES.has(suiteName)) {
    return suiteName;
  }

  return 'unknown';
}

function extractJUnitFailureMessage(failureNode: JUnitFailureNode | string): string {
  if (typeof failureNode === 'string') {
    return normalizeRawErrorMessage(failureNode) || 'Unknown JUnit failure';
  }

  return (
    normalizeRawErrorMessage(failureNode['#text']) ||
    normalizeRawErrorMessage(failureNode['@_message']) ||
    'Unknown JUnit failure'
  );
}

function normalizeRawErrorMessage(message: string | undefined): string {
  const trimmedMessage = message?.trim();

  if (!trimmedMessage) {
    return '';
  }

  const meaningfulLines = trimmedMessage
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^\[[^\]]+\]\s+›/.test(line))
    .filter((line) => !/^at\s/.test(line))
    .filter((line) => !/^\d+\s+\|/.test(line))
    .filter((line) => !/^>\s*\d+\s+\|/.test(line))
    .filter((line) => !/^\|\s*$/.test(line))
    .filter((line) => !/^\^+$/.test(line))
    .filter((line) => line !== 'Call log:');

  if (meaningfulLines.length === 0) {
    return trimmedMessage;
  }

  return meaningfulLines.slice(0, 3).join('\n');
}

function simplifyError(message: string): string {
  return message
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\d+ms/g, '<ms>')
    .replace(/\/[\w/.:\-]+/g, '')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '')
    .replace(/\b\d+\b/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_GROUPING_SIGNATURE_LENGTH);
}

function groupFailures(failures: FailureRecord[]): GroupedFailureRecord[] {
  const groupedFailures = new Map<string, GroupedFailureRecord>();

  for (const failure of failures) {
    const groupingKey = `${failure.testName}|||${failure.browser}|||${failure.errorSignature}`;
    const existing = groupedFailures.get(groupingKey);

    if (existing) {
      existing.count += 1;
      continue;
    }

    groupedFailures.set(groupingKey, {
      ...failure,
      count: 1,
    });
  }

  return [...groupedFailures.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    const byTestName = left.testName.localeCompare(right.testName);

    if (byTestName !== 0) {
      return byTestName;
    }

    return left.browser.localeCompare(right.browser);
  });
}

function buildMarkdownTable(groupedFailures: GroupedFailureRecord[]): string {
  const lines = ['|Test Name|Browser|Error Signature|Count|', '|---|---|---|---|'];

  for (const failure of groupedFailures) {
    lines.push(
      `|${escapeMarkdownCell(failure.testName)}|${escapeMarkdownCell(failure.browser)}|${escapeMarkdownCell(truncateForDisplay(failure.errorSignature, MAX_TABLE_SIGNATURE_LENGTH))}|${failure.count}|`,
    );
  }

  return lines.join('\n');
}

function truncateForDisplay(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function escapeMarkdownCell(value: string): string {
  const normalizedValue = value || ' ';

  return normalizedValue.replace(/\|/g, '\\|');
}

function isFailureStatus(status: string | undefined): status is FailureStatus {
  if (!status) {
    return false;
  }

  return FAILURE_STATUSES.has(status as FailureStatus);
}

function isPlaywrightReport(value: unknown): value is PlaywrightReport {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.suites);
}

function isJUnitDocument(value: unknown): value is JUnitDocument {
  if (!isRecord(value)) {
    return false;
  }

  return 'testsuite' in value || 'testsuites' in value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

void main().catch((error: unknown) => {
  console.error(formatError(error));
  process.exit(1);
});
