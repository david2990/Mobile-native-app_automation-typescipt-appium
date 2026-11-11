import type { ChainablePromiseElement } from 'webdriverio';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function screenSize(): Promise<{ width: number; height: number }> {
  const { width, height } = await driver.getWindowSize();
  return { width, height };
}

async function centerOf(element: ChainablePromiseElement): Promise<Rect> {
  const rect = await element.getLocation();
  const size = await element.getSize();
  return { ...rect, ...size };
}

/** Swipe a fraction of the screen height/width. Uses the UiAutomator2 gesture API. */
export async function swipe(direction: Direction, distance = 0.6): Promise<void> {
  const { width, height } = await screenSize();
  const horizontal = direction === 'left' || direction === 'right';
  const length = Math.round((horizontal ? width : height) * distance);
  const origin = horizontal ? width / 2 : height / 2;

  const start = Math.round(origin + length / 2);
  const end = Math.round(origin - length / 2);

  await driver.executeScript('mobile: swipeGesture', [
    {
      left: horizontal ? Math.min(start, end) : Math.round(width * 0.2),
      top: horizontal ? Math.round(height * 0.2) : Math.min(start, end),
      width: horizontal ? length : Math.round(width * 0.6),
      height: horizontal ? Math.round(height * 0.6) : length,
      direction,
      percent: 1.0,
      speed: 800,
    },
  ]);
}

/** Tap the center of an element (falls back to coordinates, which works in WebViews). */
export async function tapCenter(element: ChainablePromiseElement): Promise<void> {
  const { x, y, width, height } = await centerOf(element);
  await driver.executeScript('mobile: clickGesture', [
    { x: Math.round(x + width / 2), y: Math.round(y + height / 2) },
  ]);
}

/** Scroll the current screen until the element is visible. */
export async function scrollUntilVisible(
  element: ChainablePromiseElement,
  direction: Direction = 'down',
  maxSwipes = 8,
): Promise<void> {
  for (let attempt = 0; attempt < maxSwipes; attempt += 1) {
    if (await element.isDisplayed()) return;
    await swipe(direction);
  }
  if (!(await element.isDisplayed())) {
    throw new Error(`Element still not visible after ${maxSwipes} swipes`);
  }
}

/** Dismiss the soft keyboard if it is covering the screen. */
export async function hideKeyboard(): Promise<void> {
  try {
    if (await driver.isKeyboardShown()) await driver.hideKeyboard();
  } catch {
    // Keyboards are not always detectable; failing silently is safe here.
  }
}
