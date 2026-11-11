import { BaseScreen } from './base.screen.js';
import { byResourceId } from './locators.js';

/** Final screen after placing an order. */
export class OrderCompleteScreen extends BaseScreen {
  protected readonly marker = byResourceId('completeTV');

  get heading() {
    return $(byResourceId('completeTV'));
  }

  get thankYouMessage() {
    return $(byResourceId('thankYouTV'));
  }

  /** "Your swag is on its way!" */
  get swagMessage() {
    return $(byResourceId('swagTV'));
  }

  /** "Your order has been dispatched and will arrive as fast as the pony gallops!" */
  get dispatchMessage() {
    return $(byResourceId('orderTV'));
  }
}
