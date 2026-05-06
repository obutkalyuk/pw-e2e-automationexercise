import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { Result } from 'axe-core';

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export function formatViolations(violations: Result[]) {
  if (violations.length === 0) {
    return 'No critical or serious accessibility violations found.';
  }

  return violations
    .map((violation) => {
      return [
        `${violation.id}: ${violation.description}`,
        `Impact: ${violation.impact ?? 'unknown'}`,
        `Nodes: ${violation.nodes.length}`,
      ].join(' | ');
    })
    .join('\n');
}

export async function analyzePage(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();

  return results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
}
