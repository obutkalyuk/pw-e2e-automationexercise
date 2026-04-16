import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import {
  chromium,
  firefox,
  webkit,
  type Browser,
  type BrowserContext,
  type BrowserType,
  type CDPSession,
  type Frame,
  type Page,
  type Request,
  type Response,
} from '@playwright/test';
import { HomePage } from '../pages/homePage';
import { ProductsPage } from '../pages/productsPage';
import { CartPage } from '../pages/cartPage';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type BrowserName = 'chromium' | 'firefox' | 'webkit';
type RunMode = 'standard' | 'baseline' | 'targeted-ad-block';
type FlowName =
  | 'products-details'
  | 'brand-products'
  | 'category-products'
  | 'cart-add-products'
  | 'checkout';
type Party = 'first-party' | 'third-party';
type Classification = 'ad' | 'tracking' | 'consent' | 'support' | 'unknown';
type FrameContext = 'main-frame' | 'sub-frame' | 'other';
type EventType = 'vignette-url' | 'overlay-dom';

type CliOptions = {
  runs: number;
  headed: boolean;
  slowMo: number;
  browsers: BrowserName[];
  modes: RunMode[];
  flows: FlowName[];
  outputRoot: string;
};

type CdpInitiatorRecord = {
  url: string;
  timestampMs: number;
  initiatorType?: string;
  initiatorUrl?: string;
  initiatorStack?: string[];
  consumed: boolean;
};

type RequestRecord = {
  id: string;
  timestampMs: number;
  timestampIso: string;
  pageUrlAtRequest: string;
  requestUrl: string;
  hostname: string;
  resourceType: string;
  method: string;
  frameContext: FrameContext;
  frameUrl: string;
  isNavigationRequest: boolean;
  responseStatus?: number;
  contentType?: string;
  redirectLocation?: string;
  referer?: string;
  party: Party;
  classification: Classification;
  initiatorType?: string;
  initiatorUrl?: string;
  initiatorStack?: string[];
  failureText?: string;
};

type DetectionEvent = {
  id: string;
  type: EventType;
  timestampMs: number;
  timestampIso: string;
  pageUrl: string;
  details: Record<string, unknown>;
  correlatedRequestIds: string[];
};

type RunArtifact = {
  flow: FlowName;
  mode: RunMode;
  browserName: BrowserName;
  runIndex: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  finalUrl: string;
  errorMessage?: string;
  harPath: string;
  requests: RequestRecord[];
  events: DetectionEvent[];
  screenshotPath?: string;
};

type HostSummary = {
  hostname: string;
  requests: number;
  browsers: string[];
  flows: string[];
  modes: string[];
  classifications: Classification[];
};

const FLOW_NAMES: FlowName[] = [
  'products-details',
  'brand-products',
  'category-products',
  'cart-add-products',
  'checkout',
];

const BROWSER_TYPES: Record<BrowserName, BrowserType> = {
  chromium,
  firefox,
  webkit,
};

const OVERLAY_SELECTORS = [
  'iframe[src*="googleads"]',
  'iframe[src*="doubleclick"]',
  'iframe[id*="google_ads"]',
  '[id*="google_vignette"]',
  '[id*="interstitial"]',
  '[class*="interstitial"]',
  'div.GoogleActiveViewElement',
  'div[id="ad_position_box"]',
];

const FIRST_PARTY_HOSTS = new Set([
  'automationexercise.com',
  'www.automationexercise.com',
]);

const AD_DOMAINS_PRIMARY = [
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'googleads4.g.doubleclick.net',
  'ep1.adtrafficquality.google',
  'ep2.adtrafficquality.google',
] as const;

const AD_DOMAINS_SECONDARY = [
  'cm.g.doubleclick.net',
  's0.2mdn.net',
] as const;

const TARGETED_AD_BLOCK_HOSTS: ReadonlySet<string> = new Set([
  ...AD_DOMAINS_PRIMARY,
  ...AD_DOMAINS_SECONDARY,
]);

function getArgValue(name: string): string | undefined {
  const flag = `--${name}`;
  const withEqualsPrefix = `${flag}=`;
  const exactIndex = process.argv.indexOf(flag);

  if (exactIndex >= 0) {
    return process.argv[exactIndex + 1];
  }

  const withEquals = process.argv.find((item) => item.startsWith(withEqualsPrefix));
  return withEquals ? withEquals.slice(withEqualsPrefix.length) : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeName(value: string): string {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function createStamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

function parseCsvList<T extends string>(raw: string | undefined, allowed: readonly T[]): T[] {
  if (!raw) {
    return [...allowed];
  }

  const allowedSet = new Set(allowed);
  const values = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as T[];

  const invalidValues = values.filter((item) => !allowedSet.has(item));
  if (invalidValues.length > 0) {
    throw new Error(`Unsupported values: ${invalidValues.join(', ')}`);
  }

  return values.length > 0 ? values : [...allowed];
}

function parseOptions(): CliOptions {
  const runs = Number(getArgValue('runs') ?? '5');
  const slowMo = Number(getArgValue('slowmo') ?? '0');
  const outputRoot = path.resolve(
    process.cwd(),
    getArgValue('output') ?? path.join('artifacts', 'ad-traffic-spike', createStamp())
  );

  if (!Number.isInteger(runs) || runs <= 0) {
    throw new Error(`--runs must be a positive integer, received: ${String(runs)}`);
  }

  if (Number.isNaN(slowMo) || slowMo < 0) {
    throw new Error(`--slowmo must be a non-negative number, received: ${String(slowMo)}`);
  }

  return {
    runs,
    headed: hasFlag('headed'),
    slowMo,
    browsers: parseCsvList(getArgValue('browsers'), ['chromium', 'firefox', 'webkit'] as const),
    modes: parseCsvList(
      getArgValue('modes'),
      ['standard', 'baseline', 'targeted-ad-block'] as const
    ),
    flows: parseCsvList(getArgValue('flows'), FLOW_NAMES),
    outputRoot,
  };
}

function toParty(hostname: string): Party {
  return FIRST_PARTY_HOSTS.has(hostname) || hostname.endsWith('.automationexercise.com')
    ? 'first-party'
    : 'third-party';
}

function classifyHostname(hostname: string): Classification {
  const adIndicators = [
    'doubleclick',
    'googleads',
    'googlesyndication',
    'adservice',
    'adnxs',
    'criteo',
    'taboola',
    'outbrain',
    'amazon-adsystem',
    'adsystem',
    'adtraffic',
    'ads.',
  ];
  const trackingIndicators = [
    'google-analytics',
    'googletagmanager',
    'analytics',
    'clarity',
    'hotjar',
    'segment',
    'mixpanel',
    'facebook',
    'bing',
    'newrelic',
  ];
  const consentIndicators = ['consent', 'cookie', 'onetrust', 'trustarc', 'quantcast', 'fundingchoices'];
  const supportIndicators = ['gstatic', 'googleapis', 'cloudflare', 'jsdelivr', 'cdnjs', 'bootstrapcdn'];

  if (adIndicators.some((item) => hostname.includes(item))) {
    return 'ad';
  }
  if (trackingIndicators.some((item) => hostname.includes(item))) {
    return 'tracking';
  }
  if (consentIndicators.some((item) => hostname.includes(item))) {
    return 'consent';
  }
  if (supportIndicators.some((item) => hostname.includes(item))) {
    return 'support';
  }

  return 'unknown';
}

function summarizeContentType(contentType?: string): string | undefined {
  return contentType?.split(';')[0]?.trim() || undefined;
}

function inferFrameContext(page: Page, frame: Frame | null): FrameContext {
  if (!frame) {
    return 'other';
  }
  if (frame === page.mainFrame()) {
    return 'main-frame';
  }
  return 'sub-frame';
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getCorrelationWindowIds(
  eventTimestampMs: number,
  requests: RequestRecord[],
  windowMs = 2_000
): string[] {
  return requests
    .filter(
      (record) =>
        record.party === 'third-party' &&
        Math.abs(record.timestampMs - eventTimestampMs) <= windowMs
    )
    .map((record) => record.id);
}

async function maybeAttachCdp(page: Page, browserName: BrowserName): Promise<CDPSession | null> {
  if (browserName !== 'chromium') {
    return null;
  }

  return page.context().newCDPSession(page);
}

async function configureInitiatorTracking(
  page: Page,
  browserName: BrowserName,
  bucket: CdpInitiatorRecord[]
): Promise<CDPSession | null> {
  const session = await maybeAttachCdp(page, browserName);

  if (!session) {
    return null;
  }

  await session.send('Network.enable');
  session.on('Network.requestWillBeSent', (event: any) => {
    const initiatorStack = Array.isArray(event.initiator?.stack?.callFrames)
      ? event.initiator.stack.callFrames
          .map((frame: { url?: string; functionName?: string; lineNumber?: number }) => {
            const functionName = frame.functionName || '<anonymous>';
            const url = frame.url || 'unknown';
            const lineNumber = typeof frame.lineNumber === 'number' ? frame.lineNumber + 1 : 0;
            return `${functionName} @ ${url}:${lineNumber}`;
          })
          .slice(0, 8)
      : [];

    bucket.push({
      url: event.request?.url ?? '',
      timestampMs: Date.now(),
      initiatorType: event.initiator?.type,
      initiatorUrl: event.documentURL,
      initiatorStack,
      consumed: false,
    });
  });

  return session;
}

function consumeInitiator(
  requestUrl: string,
  requestTimestampMs: number,
  bucket: CdpInitiatorRecord[]
): Pick<RequestRecord, 'initiatorType' | 'initiatorUrl' | 'initiatorStack'> {
  const match = bucket.find(
    (item) =>
      !item.consumed &&
      item.url === requestUrl &&
      Math.abs(item.timestampMs - requestTimestampMs) <= 2_000
  );

  if (!match) {
    return {};
  }

  match.consumed = true;
  return {
    initiatorType: match.initiatorType,
    initiatorUrl: match.initiatorUrl,
    initiatorStack: match.initiatorStack,
  };
}

async function detectOverlay(page: Page): Promise<{ matchedSelectors: string[]; visibleCount: number }> {
  try {
    return await page.evaluate((selectors) => {
      const matchedSelectors: string[] = [];

      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        const visibleElements = elements.filter((element) => {
          const node = element as HTMLElement;
          const style = window.getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return (
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            Number(style.opacity || '1') > 0 &&
            rect.width > 0 &&
            rect.height > 0
          );
        });

        if (visibleElements.length > 0) {
          matchedSelectors.push(selector);
        }
      }

      return {
        matchedSelectors,
        visibleCount: matchedSelectors.length,
      };
    }, OVERLAY_SELECTORS);
  } catch {
    return {
      matchedSelectors: [],
      visibleCount: 0,
    };
  }
}

async function startOverlayPolling(
  page: Page,
  events: DetectionEvent[],
  requests: RequestRecord[]
): Promise<() => Promise<void>> {
  let disposed = false;
  let lastSignature = '';

  const poll = async (): Promise<void> => {
    if (disposed || page.isClosed()) {
      return;
    }

    const result = await detectOverlay(page);
    const signature = result.matchedSelectors.join('|');

    if (result.visibleCount > 0 && signature !== lastSignature) {
      const timestampMs = Date.now();
      events.push({
        id: `EV-${String(events.length + 1).padStart(4, '0')}`,
        type: 'overlay-dom',
        timestampMs,
        timestampIso: new Date(timestampMs).toISOString(),
        pageUrl: page.url(),
        details: {
          matchedSelectors: result.matchedSelectors,
          visibleCount: result.visibleCount,
        },
        correlatedRequestIds: getCorrelationWindowIds(timestampMs, requests),
      });
    }

    lastSignature = signature;
    setTimeout(() => {
      void poll();
    }, 1_000);
  };

  void poll();

  return async () => {
    disposed = true;
  };
}

async function attachNetworkRecorder(
  page: Page,
  browserName: BrowserName,
  requests: RequestRecord[],
  events: DetectionEvent[]
): Promise<() => Promise<void>> {
  const requestMap = new Map<Request, RequestRecord>();
  const initiatorBucket: CdpInitiatorRecord[] = [];
  const cdpSession = await configureInitiatorTracking(page, browserName, initiatorBucket);
  let isDisposed = false;

  page.on('request', (request) => {
    const timestampMs = Date.now();
    const requestUrl = request.url();
    let parsedUrl: URL | null = null;

    try {
      parsedUrl = new URL(requestUrl);
    } catch {
      parsedUrl = null;
    }

    const hostname = parsedUrl?.hostname ?? 'unknown';
    const party = parsedUrl ? toParty(hostname) : 'third-party';
    const frame = request.frame() ?? null;

    const record: RequestRecord = {
      id: `RQ-${String(requests.length + 1).padStart(5, '0')}`,
      timestampMs,
      timestampIso: new Date(timestampMs).toISOString(),
      pageUrlAtRequest: page.url(),
      requestUrl,
      hostname,
      resourceType: request.resourceType(),
      method: request.method(),
      frameContext: inferFrameContext(page, frame),
      frameUrl: frame?.url() ?? '',
      isNavigationRequest: request.isNavigationRequest(),
      referer: request.headers()['referer'],
      party,
      classification: parsedUrl ? classifyHostname(hostname) : 'unknown',
      ...consumeInitiator(requestUrl, timestampMs, initiatorBucket),
    };

    requests.push(record);
    requestMap.set(request, record);
  });

  page.on('response', async (response: Response) => {
    if (isDisposed) {
      return;
    }

    const request = response.request();
    const record = requestMap.get(request);

    if (!record) {
      return;
    }

    try {
      const headers = await response.allHeaders();
      record.responseStatus = response.status();
      record.contentType = summarizeContentType(headers['content-type']);
      record.redirectLocation = headers.location;
    } catch (error) {
      if (isDisposed) {
        return;
      }

      const message = formatError(error);
      if (/Target page, context or browser has been closed/i.test(message)) {
        return;
      }

      throw error;
    }
  });

  page.on('requestfailed', (request) => {
    if (isDisposed) {
      return;
    }

    const record = requestMap.get(request);

    if (!record) {
      return;
    }

    record.failureText = request.failure()?.errorText ?? 'Unknown request failure';
  });

  page.on('framenavigated', (frame) => {
    if (isDisposed) {
      return;
    }

    if (frame !== page.mainFrame()) {
      return;
    }

    if (!page.url().includes('#google_vignette')) {
      return;
    }

    const timestampMs = Date.now();
    events.push({
      id: `EV-${String(events.length + 1).padStart(4, '0')}`,
      type: 'vignette-url',
      timestampMs,
      timestampIso: new Date(timestampMs).toISOString(),
      pageUrl: page.url(),
      details: {
        frameUrl: frame.url(),
      },
      correlatedRequestIds: getCorrelationWindowIds(timestampMs, requests),
    });
  });

  return async () => {
    isDisposed = true;

    if (cdpSession) {
      await cdpSession.detach().catch(() => {});
    }
  };
}

async function applyBaselineRouting(context: BrowserContext): Promise<void> {
  await context.route('**/*', async (route) => {
    const requestUrl = route.request().url();
    let parsedUrl: URL | null = null;

    try {
      parsedUrl = new URL(requestUrl);
    } catch {
      parsedUrl = null;
    }

    if (!parsedUrl || !['http:', 'https:'].includes(parsedUrl.protocol)) {
      await route.continue();
      return;
    }

    if (toParty(parsedUrl.hostname) === 'third-party') {
      await route.abort();
      return;
    }

    await route.continue();
  });
}

async function applyTargetedAdBlockRouting(context: BrowserContext): Promise<void> {
  await context.route('**/*', async (route) => {
    const requestUrl = route.request().url();
    let parsedUrl: URL | null = null;

    try {
      parsedUrl = new URL(requestUrl);
    } catch {
      parsedUrl = null;
    }

    if (!parsedUrl || !['http:', 'https:'].includes(parsedUrl.protocol)) {
      await route.continue();
      return;
    }

    if (TARGETED_AD_BLOCK_HOSTS.has(parsedUrl.hostname)) {
      await route.abort();
      return;
    }

    await route.continue();
  });
}

async function runProductsDetailsFlow(page: Page): Promise<void> {
  const homePage = new HomePage(page);
  const productsPage = new ProductsPage(page);

  await page.goto('/');
  await homePage.handleCommonAds();
  await productsPage.goToProducts();
  await productsPage.verifyProductsPageOpen();
  await productsPage.openProductDetails(1);
  await page.waitForURL(/\/product_details\//, { timeout: 15_000 });
}

async function runBrandProductsFlow(page: Page): Promise<void> {
  const productsPage = new ProductsPage(page);

  await page.goto('/');
  await productsPage.goToProducts();
  await productsPage.verifyProductsPageOpen();
  await productsPage.productSidebar.verifyBrandsVisible();
  await productsPage.productSidebar.openBrand('Polo', () => productsPage.handleCommonAds());
  await productsPage.productSidebar.verifyBrandResult('Polo');
  await productsPage.productSidebar.openBrand('Biba', () => productsPage.handleCommonAds());
  await productsPage.productSidebar.verifyBrandResult('Biba');
}

async function runCategoryProductsFlow(page: Page): Promise<void> {
  const homePage = new HomePage(page);

  await page.goto('/');
  await homePage.handleCommonAds();
  await homePage.productSidebar.verifyCategoriesVisible();
  await homePage.productSidebar.expandCategory('Women', () => homePage.handleCommonAds());
  await homePage.productSidebar.openSubcategory('Women', 'Saree', '7', () => homePage.handleCommonAds());
  await homePage.productSidebar.verifyCategoryResult('Women', 'Saree', '7');
  await homePage.productSidebar.expandCategory('Men', () => homePage.handleCommonAds());
  await homePage.productSidebar.openSubcategory('Men', 'Jeans', '6', () => homePage.handleCommonAds());
  await homePage.productSidebar.verifyCategoryResult('Men', 'Jeans', '6');
}

async function runCartAddProductsFlow(page: Page): Promise<void> {
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);

  await page.goto('/products');
  await productsPage.handleCommonAds();
  await productsPage.verifyProductsPageOpen();
  await productsPage.addProductById('1');
  await productsPage.addProductToCart('2');
  await productsPage.viewCartFromModal();
  await cartPage.verifyCartIsOpen();
}

async function runCheckoutFlow(page: Page): Promise<void> {
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);

  await page.goto('/products');
  await productsPage.handleCommonAds();
  await productsPage.addMultipleProducts(['1', '2', '3']);
  await productsPage.goToCart();
  await cartPage.verifyCartIsOpen();
  await cartPage.proceedToCheckout();

  await Promise.race([
    page.waitForURL(/\/checkout|\/login/, { timeout: 15_000 }),
    page.locator('#checkoutModal').waitFor({ state: 'visible', timeout: 15_000 }),
  ]);
}

async function runFlow(flow: FlowName, page: Page): Promise<void> {
  switch (flow) {
    case 'products-details':
      await runProductsDetailsFlow(page);
      return;
    case 'brand-products':
      await runBrandProductsFlow(page);
      return;
    case 'category-products':
      await runCategoryProductsFlow(page);
      return;
    case 'cart-add-products':
      await runCartAddProductsFlow(page);
      return;
    case 'checkout':
      await runCheckoutFlow(page);
      return;
  }
}

async function executeRun(
  browser: Browser,
  browserName: BrowserName,
  baseUrl: string,
  flow: FlowName,
  mode: RunMode,
  runIndex: number,
  artifactRoot: string
): Promise<RunArtifact> {
  const runDir = path.join(
    artifactRoot,
    sanitizeName(browserName),
    sanitizeName(mode),
    sanitizeName(flow),
    `run-${String(runIndex).padStart(2, '0')}`
  );
  ensureDir(runDir);

  const harPath = path.join(runDir, 'network.har');
  const context = await browser.newContext({
    baseURL: baseUrl,
    recordHar: { path: harPath },
  });

  if (mode === 'baseline') {
    await applyBaselineRouting(context);
  } else if (mode === 'targeted-ad-block') {
    await applyTargetedAdBlockRouting(context);
  }

  const page = await context.newPage();
  const requests: RequestRecord[] = [];
  const events: DetectionEvent[] = [];
  const startedAtMs = Date.now();
  const stopRecordingNetwork = await attachNetworkRecorder(page, browserName, requests, events);
  const stopOverlayPolling = await startOverlayPolling(page, events, requests);

  let success = false;
  let errorMessage: string | undefined;
  let screenshotPath: string | undefined;

  try {
    await runFlow(flow, page);
    success = true;
  } catch (error) {
    errorMessage = formatError(error);
    screenshotPath = path.join(runDir, 'failure.png');
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  } finally {
    await stopOverlayPolling();
    await stopRecordingNetwork();
  }

  for (const event of events) {
    event.correlatedRequestIds = getCorrelationWindowIds(event.timestampMs, requests);
  }

  const finishedAtMs = Date.now();
  const artifact: RunArtifact = {
    flow,
    mode,
    browserName,
    runIndex,
    startedAt: new Date(startedAtMs).toISOString(),
    finishedAt: new Date(finishedAtMs).toISOString(),
    durationMs: finishedAtMs - startedAtMs,
    success,
    finalUrl: page.url(),
    errorMessage,
    harPath,
    requests,
    events,
    screenshotPath,
  };

  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(artifact, null, 2), 'utf8');
  await context.close();
  return artifact;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function uniqueSortedClassifications(values: Classification[]): Classification[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function buildHostSummary(records: RunArtifact[]): HostSummary[] {
  const buckets = new Map<string, HostSummary>();

  for (const run of records) {
    for (const request of run.requests) {
      if (request.party !== 'third-party') {
        continue;
      }

      const current = buckets.get(request.hostname) ?? {
        hostname: request.hostname,
        requests: 0,
        browsers: [],
        flows: [],
        modes: [],
        classifications: [],
      };

      current.requests += 1;
      current.browsers.push(run.browserName);
      current.flows.push(run.flow);
      current.modes.push(run.mode);
      current.classifications.push(request.classification);
      buckets.set(request.hostname, current);
    }
  }

  return [...buckets.values()]
    .map((item) => ({
      ...item,
      browsers: uniqueSorted(item.browsers),
      flows: uniqueSorted(item.flows),
      modes: uniqueSorted(item.modes),
      classifications: uniqueSortedClassifications(item.classifications),
    }))
    .sort((left, right) => right.requests - left.requests);
}

function buildEventCorrelationSummary(records: RunArtifact[]) {
  return records.flatMap((run) =>
    run.events.map((event) => ({
      browserName: run.browserName,
      mode: run.mode,
      flow: run.flow,
      runIndex: run.runIndex,
      eventType: event.type,
      timestampIso: event.timestampIso,
      pageUrl: event.pageUrl,
      correlatedRequests: event.correlatedRequestIds
        .map((requestId) => run.requests.find((request) => request.id === requestId))
        .filter((request): request is RequestRecord => Boolean(request))
        .map((request) => ({
          id: request.id,
          hostname: request.hostname,
          resourceType: request.resourceType,
          classification: request.classification,
          requestUrl: request.requestUrl,
        })),
    }))
  );
}

function buildNavigationRequestSummary(records: RunArtifact[]) {
  return records.flatMap((run) =>
    run.requests
      .filter(
        (request) =>
          request.party === 'third-party' &&
          request.isNavigationRequest &&
          request.resourceType === 'document'
      )
      .map((request) => ({
        browserName: run.browserName,
        mode: run.mode,
        flow: run.flow,
        runIndex: run.runIndex,
        hostname: request.hostname,
        requestUrl: request.requestUrl,
        frameContext: request.frameContext,
        responseStatus: request.responseStatus,
        redirectLocation: request.redirectLocation,
        initiatorType: request.initiatorType,
      }))
  );
}

function buildPassFailSummary(records: RunArtifact[]) {
  const keyToStats = new Map<
    string,
    { browserName: BrowserName; mode: RunMode; flow: FlowName; passed: number; failed: number }
  >();

  for (const run of records) {
    const key = `${run.browserName}|${run.mode}|${run.flow}`;
    const current = keyToStats.get(key) ?? {
      browserName: run.browserName,
      mode: run.mode,
      flow: run.flow,
      passed: 0,
      failed: 0,
    };

    if (run.success) {
      current.passed += 1;
    } else {
      current.failed += 1;
    }

    keyToStats.set(key, current);
  }

  return [...keyToStats.values()].sort((left, right) =>
    `${left.browserName}-${left.mode}-${left.flow}`.localeCompare(
      `${right.browserName}-${right.mode}-${right.flow}`
    )
  );
}

function buildRecommendations(hostSummary: HostSummary[], records: RunArtifact[]) {
  const blocklistCandidates = hostSummary
    .filter((item) => item.classifications.includes('ad') || item.classifications.includes('tracking'))
    .slice(0, 12)
    .map((item) => item.hostname);

  const selectorCounts = new Map<string, number>();

  for (const run of records) {
    for (const event of run.events) {
      if (event.type !== 'overlay-dom') {
        continue;
      }

      const matchedSelectors = Array.isArray(event.details.matchedSelectors)
        ? (event.details.matchedSelectors as string[])
        : [];

      for (const selector of matchedSelectors) {
        selectorCounts.set(selector, (selectorCounts.get(selector) ?? 0) + 1);
      }
    }
  }

  const selectorCandidates = [...selectorCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([selector, count]) => ({ selector, count }));

  return {
    blocklistCandidates,
    selectorCandidates,
  };
}

function renderTable(headers: string[], rows: string[][]): string[] {
  const headerLine = `|${headers.join('|')}|`;
  const separatorLine = `|${headers.map(() => '---').join('|')}|`;
  const bodyLines = rows.map((row) => `|${row.join('|')}|`);
  return [headerLine, separatorLine, ...bodyLines];
}

function buildMarkdownReport(
  options: CliOptions,
  baseUrl: string,
  records: RunArtifact[],
  outputRoot: string
): string {
  const passFail = buildPassFailSummary(records);
  const hostSummary = buildHostSummary(records);
  const likelyAdHosts = hostSummary.filter((item) => item.classifications.includes('ad')).slice(0, 15);
  const navigationSummary = buildNavigationRequestSummary(records).slice(0, 30);
  const eventCorrelation = buildEventCorrelationSummary(records).slice(0, 30);
  const recommendations = buildRecommendations(hostSummary, records);
  const totalEvents = records.reduce((total, run) => total + run.events.length, 0);
  const vignetteEvents = records.reduce(
    (total, run) => total + run.events.filter((event) => event.type === 'vignette-url').length,
    0
  );

  const lines: string[] = [
    '# Third-Party Ad Traffic Spike',
    '',
    '## Scope',
    '',
    `- Base URL: \`${baseUrl}\``,
    `- Output directory: \`${outputRoot}\``,
    `- Browsers: \`${options.browsers.join(', ')}\``,
    `- Modes: \`${options.modes.join(', ')}\``,
    `- Flows: \`${options.flows.join(', ')}\``,
    `- Runs per flow: \`${String(options.runs)}\``,
    `- Total run artifacts: \`${String(records.length)}\``,
    `- Total overlay/vignette events: \`${String(totalEvents)}\``,
    `- Vignette URL detections: \`${String(vignetteEvents)}\``,
    '',
    '## Pass/Fail Comparison',
    '',
    ...renderTable(
      ['Browser', 'Mode', 'Flow', 'Passed', 'Failed', 'Pass Rate'],
      passFail.map((item) => {
        const total = item.passed + item.failed;
        const passRate = total === 0 ? '0%' : `${Math.round((item.passed / total) * 100)}%`;
        return [
          item.browserName,
          item.mode,
          item.flow,
          String(item.passed),
          String(item.failed),
          passRate,
        ];
      })
    ),
    '',
    '## Top Third-Party Hosts',
    '',
    ...renderTable(
      ['Host', 'Requests', 'Classifications', 'Browsers', 'Flows', 'Modes'],
      hostSummary.slice(0, 20).map((item) => [
        item.hostname,
        String(item.requests),
        item.classifications.join(', '),
        item.browsers.join(', '),
        item.flows.join(', '),
        item.modes.join(', '),
      ])
    ),
    '',
    '## Likely Ad-Related Hosts',
    '',
    ...renderTable(
      ['Host', 'Requests', 'Browsers', 'Flows'],
      likelyAdHosts.map((item) => [
        item.hostname,
        String(item.requests),
        item.browsers.join(', '),
        item.flows.join(', '),
      ])
    ),
    '',
    '## Third-Party Document/Frame Navigation Requests',
    '',
    ...renderTable(
      ['Browser', 'Mode', 'Flow', 'Run', 'Host', 'Frame', 'Status', 'Initiator', 'URL'],
      navigationSummary.map((item) => [
        item.browserName,
        item.mode,
        item.flow,
        String(item.runIndex),
        item.hostname,
        item.frameContext,
        String(item.responseStatus ?? ''),
        item.initiatorType ?? '',
        item.requestUrl,
      ])
    ),
    '',
    '## Correlation With Vignette/Overlay Events',
    '',
    ...renderTable(
      ['Browser', 'Mode', 'Flow', 'Run', 'Event', 'Timestamp', 'Correlated Hosts'],
      eventCorrelation.map((item) => [
        item.browserName,
        item.mode,
        item.flow,
        String(item.runIndex),
        item.eventType,
        item.timestampIso,
        item.correlatedRequests.map((request) => request.hostname).join(', '),
      ])
    ),
    '',
    '## First-Pass Candidates',
    '',
    `- Blocklist domains: ${recommendations.blocklistCandidates.map((item) => `\`${item}\``).join(', ') || 'none captured'}`,
    `- CSS selectors: ${recommendations.selectorCandidates.map((item) => `\`${item.selector}\` (${item.count})`).join(', ') || 'none captured'}`,
    '',
    '## Notes',
    '',
    '- `baseline` mode aborts every third-party HTTP(S) request to establish a clean reference profile.',
    `- \`targeted-ad-block\` aborts only the shortlisted ad-serving hosts: ${[...TARGETED_AD_BLOCK_HOSTS].map((host) => `\`${host}\``).join(', ')}.`,
    '- Initiator stacks are best-effort and are only collected in Chromium via CDP.',
    '- Each run also writes a raw `run.json` alongside `network.har` for deeper inspection.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error('BASE_URL is not configured in .env');
  }

  const options = parseOptions();
  ensureDir(options.outputRoot);

  const allArtifacts: RunArtifact[] = [];

  for (const browserName of options.browsers) {
    const browserType = BROWSER_TYPES[browserName];
    const browser = await browserType.launch({
      headless: !options.headed,
      slowMo: options.slowMo,
    });

    try {
      for (const mode of options.modes) {
        for (const flow of options.flows) {
          for (let runIndex = 1; runIndex <= options.runs; runIndex += 1) {
            console.log(
              `[spike] browser=${browserName} mode=${mode} flow=${flow} run=${String(runIndex)}/${String(options.runs)}`
            );
            const artifact = await executeRun(
              browser,
              browserName,
              baseUrl,
              flow,
              mode,
              runIndex,
              options.outputRoot
            );
            allArtifacts.push(artifact);
          }
        }
      }
    } finally {
      await browser.close();
    }
  }

  const hostSummary = buildHostSummary(allArtifacts);
  const summaryJsonPath = path.join(options.outputRoot, 'summary.json');
  const summaryMarkdownPath = path.join(options.outputRoot, 'summary.md');
  const markdown = buildMarkdownReport(options, baseUrl, allArtifacts, options.outputRoot);
  const summary = {
    generatedAt: new Date().toISOString(),
    options,
    baseUrl,
    passFail: buildPassFailSummary(allArtifacts),
    hostSummary,
    navigationSummary: buildNavigationRequestSummary(allArtifacts),
    eventCorrelation: buildEventCorrelationSummary(allArtifacts),
    recommendations: buildRecommendations(hostSummary, allArtifacts),
    runs: allArtifacts,
  };

  fs.writeFileSync(summaryJsonPath, JSON.stringify(summary, null, 2), 'utf8');
  fs.writeFileSync(summaryMarkdownPath, markdown, 'utf8');

  console.log(`[spike] summary json: ${summaryJsonPath}`);
  console.log(`[spike] summary md: ${summaryMarkdownPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
