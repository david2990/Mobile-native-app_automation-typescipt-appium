import { BaseScreen } from './base.screen.js';
import { byDesc } from './locators.js';
import { scrollUntilVisible, tapCenter } from '../core/gestures.js';

export type ProductColor = 'Black' | 'Blue' | 'Gray' | 'Green';

/** Single product screen, reached from the catalog. */
export class ProductDetailScreen extends BaseScreen {
  // The add-to-cart button only exists on this screen.
  protected readonly marker = byDesc('Tap to add product to cart');

  /** Colour swatch, described in the view hierarchy as e.g. "Blue color". */
  async selectColor(color: ProductColor): Promise<void> {
    const swatch = $(byDesc(`${color} color`));
    await scrollUntilVisible(swatch);
    await tapCenter(swatch);
  }

  async addToCart(): Promise<void> {
    await this.tap(byDesc('Tap to add product to cart'));
  }
}
