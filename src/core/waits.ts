import type { ChainablePromiseElement } from 'webdriverio';
import { env } from '../config/environment.js';

/**
 * Wait until an element is visible. Always prefer this over a fixed sleep.
 * Throws with the selector in the message so failures are diagnosable.
 */
export async function waitForVisible(
  element: ChainablePromiseElement,
  timeout = env.EXPLICIT_WAIT_MS,
): Promise<ChainablePromiseElement> {
  await element.waitForDisplayed({
    timeout,
    timeoutMsg: `Element did not become visible within ${timeout}ms`,
  });
  return element;
}

/** Wait until an element is gone (spinner, dialog, splash screen). */
export async function waitForHidden(
  element: ChainablePromiseElement,
  timeout = env.EXPLICIT_WAIT_MS,
): Promise<boolean> {
  return element.waitForDisplayed({ timeout, reverse: true });
}

/** Wait for any one of several selectors to appear, returns the matching one. */
export async function waitForAnyVisible(
  selectors: string[],
  timeout = env.EXPLICIT_WAIT_MS,
): Promise<ChainablePromiseElement> {
  const deadline = Date.now() + timeout;
  let lastError: unknown;

  while (Date.now() < deadline) {
    for (const selector of selectors) {
      try {
        const element = $(selector);
        if (await element.isDisplayed()) return element;
      } catch (error) {
        lastError = error;
      }
    }
    await driver.pause(250);
  }

  throw new Error(
    `None of these selectors became visible within ${timeout}ms: ${selectors.join(', ')}` +
      (lastError ? `\nLast error: ${String(lastError)}` : ''),
  );
}
