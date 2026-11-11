import { BaseScreen } from './base.screen.js';
import { byDesc, byResourceId } from './locators.js';
import { hideKeyboard, scrollUntilVisible, tapCenter } from '../core/gestures.js';

export interface ShippingAddress {
  fullName: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
  country: string;
}

export interface PaymentCard {
  holder: string;
  number: string;
  /** MM/YY, must be a future date or the app rejects it. */
  expiry: string;
  cvv: string;
}

/**
 * Step 1 of checkout: shipping address.
 * Note the three checkout buttons share the resource id `paymentBtn`; they are
 * told apart by content-desc, which is why every step below is described.
 */
export class CheckoutAddressScreen extends BaseScreen {
  protected readonly marker = byDesc('Saves user info for checkout');

  async fill(address: ShippingAddress): Promise<void> {
    await this.type(byResourceId('fullNameET'), address.fullName);
    await this.type(byResourceId('address1ET'), address.address1);
    if (address.address2) {
      await this.type(byResourceId('address2ET'), address.address2);
    }
    await this.type(byResourceId('cityET'), address.city);
    await this.type(byResourceId('zipET'), address.zip);
    await this.type(byResourceId('countryET'), address.country);
    await hideKeyboard();
    await this.tap(byDesc('Saves user info for checkout'));
  }
}

/** Step 2 of checkout: payment method. */
export class CheckoutPaymentScreen extends BaseScreen {
  protected readonly marker = byDesc('Saves payment info and launches screen to review checkout data');

  async fill(card: PaymentCard): Promise<void> {
    await this.type(byResourceId('nameET'), card.holder);
    await this.type(byResourceId('cardNumberET'), card.number);
    await this.type(byResourceId('expirationDateET'), card.expiry);
    await this.type(byResourceId('securityCodeET'), card.cvv);
    await hideKeyboard();
    await this.tap(byDesc('Saves payment info and launches screen to review checkout data'));
  }
}

/** Step 3 of checkout: review and place the order. */
export class CheckoutReviewScreen extends BaseScreen {
  protected readonly marker = byDesc('Completes the process of checkout');

  get totalAmount() {
    return $(byResourceId('totalAmountTV'));
  }

  async placeOrder(): Promise<void> {
    const button = $(byDesc('Completes the process of checkout'));
    // The button sits below the order summary, often past the fold.
    await scrollUntilVisible(button);
    await tapCenter(button);
  }
}
