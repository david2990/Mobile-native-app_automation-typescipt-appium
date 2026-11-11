import type { ChainablePromiseElement } from 'webdriverio';
import { env } from '../config/environment.js';
import { waitForVisible } from '../core/waits.js';

/**
 * Base class for screen objects.
 *
 * Every screen declares a `marker` selector that only exists on that screen;
 * tests use `waitUntilLoaded()` instead of guessing how long navigation takes.
 * Locators should be resource-id or accessibility-id based:
 *   ~loginButton            -> accessibility id (recommended)
 *   android=new UiSelector().resourceId("...")  -> id selector (fast)
 */
export abstract class BaseScreen {
  /** Selector proving this screen is on display. */
  protected abstract readonly marker: string;

  get root(): ChainablePromiseElement {
    return $(this.marker);
  }

  async waitUntilLoaded(timeout = env.EXPLICIT_WAIT_MS): Promise<this> {
    await waitForVisible(this.root, timeout);
    return this;
  }

  async isLoaded(): Promise<boolean> {
    try {
      return await this.root.isDisplayed();
    } catch {
      return false;
    }
  }

  protected element(selector: string): ChainablePromiseElement {
    return $(selector);
  }

  protected elements(selector: string) {
    return $$(selector);
  }

  protected async tap(selector: string): Promise<void> {
    const target = await waitForVisible($(selector));
    await target.click();
  }

  protected async type(selector: string, value: string): Promise<void> {
    const field = await waitForVisible($(selector));
    await field.setValue(value);
  }

  protected async readText(selector: string): Promise<string> {
    return (await waitForVisible($(selector))).getText();
  }
}
