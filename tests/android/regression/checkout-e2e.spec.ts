/**
 * TC-001 - buy the Sauce Labs backpack, end to end.
 *
 * Covers the whole purchase path including the login gate that appears when a
 * logged-out user proceeds to checkout. The session starts with a clean app
 * (NO_RESET=false), so this suite is repeatable without manual cleanup.
 */
import { CatalogScreen } from '../../../src/pages/catalog.screen.js';
import { ProductDetailScreen } from '../../../src/pages/product-detail.screen.js';
import { CartScreen } from '../../../src/pages/cart.screen.js';
import { LoginScreen } from '../../../src/pages/login.screen.js';
import {
  CheckoutAddressScreen,
  CheckoutPaymentScreen,
  CheckoutReviewScreen,
  type PaymentCard,
  type ShippingAddress,
} from '../../../src/pages/checkout.screen.js';
import { OrderCompleteScreen } from '../../../src/pages/order-complete.screen.js';

const CREDENTIALS = { username: 'bod@example.com', password: '10203040' };

const ADDRESS: ShippingAddress = {
  fullName: 'Rebecca Winter',
  address1: '123 Main Street',
  address2: 'Apt 4B',
  city: 'Sunnyvale',
  zip: '94085',
  country: 'United States',
};

const CARD: PaymentCard = {
  holder: 'Rebecca Winter',
  number: '4242424242424242',
  expiry: '12/30',
  cvv: '123',
};

describe('@regression TC-001 purchase journey', () => {
  it('buys the Sauce Labs backpack and confirms the order', async () => {
    const catalog = await new CatalogScreen().waitUntilLoaded();

    // 1-2. Launch, then open the backpack from the catalog.
    await catalog.openProduct('Sauce Labs Backpack');

    // 3. Blue swatch on the product detail screen.
    const detail = await new ProductDetailScreen().waitUntilLoaded();
    await detail.selectColor('Blue');

    // 4. Add to cart, then open the cart from the top-right icon.
    await detail.addToCart();
    await catalog.openCart();

    // 5. Proceed to checkout.
    const cart = await new CartScreen().waitUntilLoaded();
    expect(await cart.totalLabel.getText()).toMatch(/\$\s?\d/);
    await cart.proceedToCheckout();

    // 6-7. Logged-out checkout is gated by the login screen.
    const login = await new LoginScreen().waitUntilLoaded();
    await login.login(CREDENTIALS.username, CREDENTIALS.password);

    // 8-9. Shipping address form, then "To Payment".
    const address = await new CheckoutAddressScreen().waitUntilLoaded();
    await address.fill(ADDRESS);

    // 10-11. Payment form, then "Review Order".
    const payment = await new CheckoutPaymentScreen().waitUntilLoaded();
    await payment.fill(CARD);

    // 12. Review the order and place it.
    const review = await new CheckoutReviewScreen().waitUntilLoaded();
    expect(await review.totalAmount.getText()).toMatch(/\$\s?\d+/);
    await review.placeOrder();

    // 13. The order is accepted and confirmed on screen.
    const complete = await new OrderCompleteScreen().waitUntilLoaded();
    expect(await complete.heading.getText()).toContain('Checkout Complete');
    expect(await complete.thankYouMessage.getText()).toContain('Thank you for your order');
    expect(await complete.swagMessage.getText()).toContain('Your new swag is on its way');
    expect(await complete.dispatchMessage.getText()).toContain('dispatched');
  });
});
