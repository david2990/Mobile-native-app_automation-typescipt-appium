import { env } from '../config/environment.js';

/**
 * Locator helpers.
 *
 * Accessibility ids (content-desc) come first: they express intent, survive
 * layout changes and are what Android exposes to assistive tech. Resource ids
 * are the fallback for elements that have no unique description, and text
 * selectors are a last resort for list items.
 */
const DEFAULT_PACKAGE = 'com.saucelabs.mydemoapp.android';

function appPackage(): string {
  return env.APP_PACKAGE ?? DEFAULT_PACKAGE;
}

/** Accessibility id: `~Tap to add product to cart`. */
export const byDesc = (value: string): string => `~${value}`;

/** Resource id inside the app under test: `<pkg>:id/cartBt`. */
export function byResourceId(id: string): string {
  return `android=new UiSelector().resourceId("${appPackage()}:id/${id}")`;
}

/** Exact visible text. */
export const byText = (value: string): string => `android=new UiSelector().text("${value}")`;
