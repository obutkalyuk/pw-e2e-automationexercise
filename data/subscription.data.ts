import { TestInfo } from '@playwright/test';

export function createSubscriptionEmail(testInfo: TestInfo) {
  const runStartedAt = new Date().toISOString().replace(/[:.]/g, '-');
  const workerSuffix = `w${testInfo.workerIndex}`;

  return `qa.subscription.${workerSuffix}.${runStartedAt}@example.com`;
}
