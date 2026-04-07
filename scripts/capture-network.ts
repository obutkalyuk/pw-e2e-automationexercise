import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { chromium, type Request } from '@playwright/test';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type CaptureRecord = {
  id: string;
  method: string;
  url: string;
  path: string;
  resourceType: string;
  postData: string;
  startedAt: string;
  status?: number;
  contentType?: string;
  location?: string;
  finishedAt?: string;
  failureText?: string;
};

type CaptureMetadata = {
  label: string;
  baseUrl: string;
  startUrl: string;
  startedAt: string;
  stoppedAt: string;
  includeScripts: boolean;
};

const args = process.argv.slice(2);

function getArgValue(name: string, fallback: string): string {
  const flag = `--${name}`;
  const flagWithEquals = `${flag}=`;
  const exactIndex = args.indexOf(flag);

  if (exactIndex >= 0) {
    return args[exactIndex + 1] ?? fallback;
  }

  const withEquals = args.find((arg) => arg.startsWith(flagWithEquals));
  if (withEquals) {
    return withEquals.slice(flagWithEquals.length);
  }

  return fallback;
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'capture'
  );
}

function toIsoStamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askToContinue(rl: readline.Interface, message: string): Promise<void> {
  return new Promise<void>((resolve) => {
    rl.question(message, () => resolve());
  });
}

function trimText(value: string, maxLength = 160): string {
  if (!value) {
    return '';
  }

  const singleLine = value.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return `${singleLine.slice(0, maxLength - 3)}...`;
}

function shouldIgnoreByExtension(pathname: string): boolean {
  return /\.(?:png|jpe?g|gif|webp|svg|ico|css|woff2?|ttf|eot|map|mp4|webm|mp3)$/i.test(pathname);
}

function createRequestFilter(baseUrl: string, includeScripts: boolean) {
  const baseHost = new URL(baseUrl).hostname;
  const firstPartyHosts = new Set([baseHost, `www.${baseHost.replace(/^www\./, '')}`]);
  const ignoredHostSnippets = [
    'googleads',
    'doubleclick',
    'googlesyndication',
    'google-analytics',
    'googletagmanager',
    'googleusercontent',
    'facebook',
    'clarity',
    'hotjar',
    'bing',
    'analytics',
  ];
  const ignoredResourceTypes = new Set(['image', 'media', 'font', 'stylesheet']);

  return (request: Request): boolean => {
    const url = new URL(request.url());
    const hostname = url.hostname;
    const resourceType = request.resourceType();

    if (ignoredHostSnippets.some((snippet) => hostname.includes(snippet))) {
      return false;
    }

    if (!firstPartyHosts.has(hostname) && !hostname.endsWith('.automationexercise.com')) {
      return false;
    }

    if (ignoredResourceTypes.has(resourceType)) {
      return false;
    }

    if (shouldIgnoreByExtension(url.pathname)) {
      return false;
    }

    if (resourceType === 'script' && !includeScripts) {
      return false;
    }

    return true;
  };
}

function summarizeContentType(contentType?: string): string {
  if (!contentType) {
    return 'unknown';
  }

  return contentType.split(';')[0].trim();
}

function formatMarkdown(records: CaptureRecord[], metadata: CaptureMetadata): string {
  const lines = [
    '# Network Capture Summary',
    '',
    `- Label: \`${metadata.label}\``,
    `- Base URL: \`${metadata.baseUrl}\``,
    `- Start URL: \`${metadata.startUrl}\``,
    `- Started at: \`${metadata.startedAt}\``,
    `- Stopped at: \`${metadata.stoppedAt}\``,
    `- Captured requests: \`${records.length}\``,
    '',
    '## Requests',
    '',
  ];

  for (const record of records) {
    lines.push(`### ${record.id} - ${record.method} ${record.path}`);
    lines.push(`- URL: \`${record.url}\``);
    lines.push(`- Resource type: \`${record.resourceType}\``);
    lines.push(`- Status: \`${record.status ?? 'failed/no-response'}\``);
    lines.push(`- Content-Type: \`${record.contentType || 'unknown'}\``);
    if (record.location) {
      lines.push(`- Redirect location: \`${record.location}\``);
    }
    if (record.failureText) {
      lines.push(`- Failure: \`${record.failureText}\``);
    }
    if (record.postData) {
      lines.push(`- Payload: \`${trimText(record.postData)}\``);
    }
    lines.push(`- Started: \`${record.startedAt}\``);
    lines.push(`- Finished: \`${record.finishedAt || 'n/a'}\``);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error('BASE_URL is not set in .env');
  }

  const label = getArgValue('label', 'manual-flow');
  const startPath = getArgValue('path', '/');
  const includeScripts = hasFlag('include-scripts');
  const slowMo = Number(getArgValue('slowmo', '150'));
  const startUrl = new URL(startPath, baseUrl).toString();
  const outputDir = path.resolve(process.cwd(), 'artifacts', 'network-captures');
  const startedAt = new Date();
  const stamp = toIsoStamp(startedAt);
  const safeLabel = slugify(label);
  const jsonOutputPath = path.join(outputDir, `${stamp}-${safeLabel}.json`);
  const markdownOutputPath = path.join(outputDir, `${stamp}-${safeLabel}.md`);
  const rl = createPrompt();

  ensureDir(outputDir);

  const browser = await chromium.launch({
    headless: false,
    slowMo,
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  const shouldKeepRequest = createRequestFilter(baseUrl, includeScripts);
  const requestMap = new Map<Request, CaptureRecord>();
  const records: CaptureRecord[] = [];
  let isRecording = false;
  let sequence = 0;

  page.on('request', (request) => {
    if (!isRecording || !shouldKeepRequest(request)) {
      return;
    }

    sequence += 1;
    const url = new URL(request.url());
    const record: CaptureRecord = {
      id: `RQ-${String(sequence).padStart(3, '0')}`,
      method: request.method(),
      url: request.url(),
      path: `${url.pathname}${url.search}`,
      resourceType: request.resourceType(),
      postData: request.postData() || '',
      startedAt: new Date().toISOString(),
    };

    requestMap.set(request, record);
    records.push(record);
  });

  page.on('response', async (response) => {
    if (!isRecording) {
      return;
    }

    const request = response.request();
    const record = requestMap.get(request);

    if (!record) {
      return;
    }

    const headers = await response.allHeaders();
    record.status = response.status();
    record.contentType = summarizeContentType(headers['content-type']);
    record.location = headers.location || '';
    record.finishedAt = new Date().toISOString();
  });

  page.on('requestfailed', (request) => {
    if (!isRecording) {
      return;
    }

    const record = requestMap.get(request);

    if (!record) {
      return;
    }

    record.failureText = request.failure()?.errorText || 'Unknown request failure';
    record.finishedAt = new Date().toISOString();
  });

  console.log(`Opening ${startUrl}`);
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });

  console.log('');
  console.log('Manual capture flow:');
  console.log('1. Prepare the page in the browser.');
  console.log('2. Return to this terminal and press Enter to start recording.');
  console.log('3. Perform the action you want to analyze.');
  console.log('4. Return to this terminal and press Enter again to stop recording.');
  console.log('');

  await askToContinue(rl, 'Press Enter when the page is ready and you want to START recording...');
  isRecording = true;
  console.log('Recording started. Perform the target action in the browser.');

  await askToContinue(rl, 'Press Enter when you want to STOP recording...');
  isRecording = false;

  const stoppedAt = new Date();
  const metadata: CaptureMetadata = {
    label,
    baseUrl,
    startUrl,
    startedAt: startedAt.toISOString(),
    stoppedAt: stoppedAt.toISOString(),
    includeScripts,
  };

  fs.writeFileSync(
    jsonOutputPath,
    JSON.stringify({ metadata, records }, null, 2),
    'utf8'
  );

  fs.writeFileSync(markdownOutputPath, formatMarkdown(records, metadata), 'utf8');

  console.log('');
  console.log(`Saved JSON capture to ${jsonOutputPath}`);
  console.log(`Saved Markdown summary to ${markdownOutputPath}`);
  console.log(`Captured ${records.length} request(s).`);

  rl.close();
  await context.close();
  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
