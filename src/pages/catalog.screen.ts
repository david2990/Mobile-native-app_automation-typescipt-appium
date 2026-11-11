import { BaseScreen } from './base.screen.js';
import { byDesc, byResourceId } from './locators.js';
import { swipe, tapCenter } from '../core/gestures.js';
import { waitForVisible } from '../core/waits.js';

/** Product listing shown on app launch. */
export class CatalogScreen extends BaseScreen {
  protected readonly marker = byDesc('Displays all products of catalog');

  /**
   * Open the product with this title.
   *
   * The title label is not clickable and does not forward touches - the card's
   * image is the tap target - so titles and images are paired by list index.
   * Both are rendered in the same order inside each card, which is what makes
   * the pairing reliable.
   */
  async openProduct(name: string): Promise<void> {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const titles = $$(byResourceId('titleTV'));
      const images = $$(byDesc('Product Image'));
      const count = (await titles).length;

      for (let index = 0; index < count; index += 1) {
        const text = await titles[index].getText();
        if (text.trim() === name) {
          await tapCenter(images[index]);
          return;
        }
      }

      await swipe('up', 0.4);
    }

    throw new Error(`Product "${name}" was not found in the catalog`);
  }

  /** Cart icon in the top-right corner. */
  async openCart(): Promise<void> {
    await this.tap(byDesc('View cart'));
  }

  /** Number shown on the cart badge. */
  async cartBadgeCount(): Promise<string> {
    return (await waitForVisible($(byResourceId('cartTV')))).getText();
  }
}
