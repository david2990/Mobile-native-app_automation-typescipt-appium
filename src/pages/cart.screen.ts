import { BaseScreen } from './base.screen.js';
import { byDesc, byResourceId } from './locators.js';

/** "My Cart" screen. */
export class CartScreen extends BaseScreen {
  // The checkout button carries this description only on the cart screen.
  protected readonly marker = byDesc('Confirms products for checkout');

  async proceedToCheckout(): Promise<void> {
    await this.tap(byDesc('Confirms products for checkout'));
  }

  get itemsLabel() {
    return $(byResourceId('itemsTV'));
  }

  get totalLabel() {
    return $(byResourceId('totalPriceTV'));
  }
}
