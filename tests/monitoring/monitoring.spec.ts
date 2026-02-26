import { test } from '@playwright/test';
test.skip(({ browserName }) => browserName !== 'chromium', 'CDP metrics only work in Chromium');
test('Network Performance Insight with Throttling', async ({ page }) => {
  const url = process.env.BASE_URL;

  // 1. Створюємо сесію прямого доступу до протоколу Chrome (CDP)
  const session = await page.context().newCDPSession(page);
  
  // Вмикаємо емуляцію мережі (Slow 3G style)
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // ~1.6 Mbps
    uploadThroughput: 750 * 1024 / 8,        // ~750 Kbps
    latency: 150,                            // 150ms затримки додається до кожного етапу!
  });

  // 2. Датчики на API
  page.on('requestfinished', request => {
    const timing = request.timing();
    if (['fetch', 'xhr'].includes(request.resourceType())) {
      const ttfb = timing.responseStart - timing.requestStart;
      console.log(`Resource: ${request.url().substring(0, 50)}...`);
      console.log(`  TTFB: ${ttfb.toFixed(2)}ms`);
    }
  });

  // 3. Йдемо на сайт
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // 4. Збираємо фінальні метрики
  const metrics = await page.evaluate(() => {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.connectEnd - entry.secureConnectionStart,
      ttfb: entry.responseStart - entry.requestStart,
      total: entry.duration,
    };
  });

  console.log(`--- Performance Metrics (UNDER THROTTLING) ---`);
  console.table(metrics);
});