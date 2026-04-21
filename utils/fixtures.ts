import { BrowserContext, test as base } from '@playwright/test';
import { User } from '../data/user.data';
import { apiHelper } from './api-helper';

type CreatedUserCleanup = {
  track: (user: User) => void;
};

type Fixtures = {
  managedUser: User;
  createdUserCleanup: CreatedUserCleanup;
};

const TARGETED_AD_BLOCK_HOSTS = new Set([
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'googleads4.g.doubleclick.net',
  'ep1.adtrafficquality.google',
  'ep2.adtrafficquality.google',
  'cm.g.doubleclick.net',
  's0.2mdn.net',
]);

const TARGETED_AD_BLOCK_PATTERN = new RegExp(
  [...TARGETED_AD_BLOCK_HOSTS].map((host) => host.replace(/\./g, '\\.')).join('|'),
);

const CONSENT_NEUTRALIZATION_SCRIPT = `
(() => {
  const STYLE_ID = 'pw-consent-neutralizer';
  const SELECTORS = [
    'iframe[src*="fundingchoicesmessages.google.com"]',
    'iframe[src*="google.com/fundingchoices"]',
    'iframe[id*="googlefc"]',
    'iframe[name*="googlefc"]',
    '[id*="googlefc"]',
    '[class*="googlefc"]',
    '[aria-label*="consent" i]',
    '[aria-modal="true"][role="dialog"]'
  ];

  const hideMatchingNodes = () => {
    for (const selector of SELECTORS) {
      for (const node of document.querySelectorAll(selector)) {
        if (!(node instanceof HTMLElement)) continue;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('opacity', '0', 'important');
        node.style.setProperty('pointer-events', 'none', 'important');
      }
    }
  };

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      'iframe[src*="fundingchoicesmessages.google.com"]',
      'iframe[src*="google.com/fundingchoices"]',
      'iframe[id*="googlefc"]',
      'iframe[name*="googlefc"]',
      '[id*="googlefc"]',
      '[class*="googlefc"]',
      '[aria-label*="consent" i]'
    ].join(',') + '{display:none !important;visibility:hidden !important;opacity:0 !important;pointer-events:none !important;}';
    document.documentElement.appendChild(style);
  };

  ensureStyle();
  hideMatchingNodes();

  const observer = new MutationObserver(() => {
    ensureStyle();
    hideMatchingNodes();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true
  });
})();
`;

export async function applyAdAndConsentMitigation(context: BrowserContext) {
  await context.addInitScript(CONSENT_NEUTRALIZATION_SCRIPT);
  await context.route(TARGETED_AD_BLOCK_PATTERN, async (route) => {
    await route.abort();
  });
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await applyAdAndConsentMitigation(page.context());

    await use(page);
  },

  managedUser: async ({ request }, use, testInfo) => {
    const user = await apiHelper.createManagedUser(request, testInfo);
    await use(user);
    await apiHelper.deleteUserIfExists(request, user);
  },

  createdUserCleanup: async ({ request }, use) => {
    let userToDelete: User | undefined;

    await use({
      track: (user: User) => {
        userToDelete = user;
      },
    });

    await apiHelper.deleteUserIfExists(request, userToDelete);
  },
});
