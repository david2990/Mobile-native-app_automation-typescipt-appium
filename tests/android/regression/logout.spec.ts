/**
 * TC-002 - log out from the hamburger menu.
 *
 * The drawer only offers "Log Out" to a signed-in user, so the test establishes
 * that precondition through the app itself instead of assuming persisted state:
 * a fresh session starts signed out.
 */
import { CatalogScreen } from '../../../src/pages/catalog.screen.js';
import { LoginScreen } from '../../../src/pages/login.screen.js';
import { MenuScreen } from '../../../src/pages/menu.screen.js';

const CREDENTIALS = { username: 'bod@example.com', password: '10203040' };

describe('@regression TC-002 logout', () => {
  it('logs out from the menu and returns to the signed-out state', async () => {
    const catalog = await new CatalogScreen().waitUntilLoaded();
    const menu = new MenuScreen();

    // ---------------------------------------------------------------------
    // Precondition: launch the app, open the hamburger menu, then log in with
    // bod@example.com / 10203040. Every session starts signed out (NO_RESET is
    // false), so this always runs rather than being skipped conditionally.
    // ---------------------------------------------------------------------
    await menu.open();
    await menu.logIn();
    const login = await new LoginScreen().waitUntilLoaded();
    await login.login(CREDENTIALS.username, CREDENTIALS.password);
    await catalog.waitUntilLoaded();

    // 3. Reopen the drawer, which now offers Log Out to the signed-in user.
    await menu.open();
    expect(await menu.isLoggedIn()).toBe(true);
    await menu.logOut();

    // 4. Confirm in the popup.
    await menu.confirmLogout();

    // 5. Verified logged out: the app lands on the login screen, and the drawer
    //    offers Log In again instead of Log Out.
    await new LoginScreen().waitUntilLoaded();
    await menu.open();
    expect(await menu.isLoggedIn()).toBe(false);
    expect(await menu.loginItem.isExisting()).toBe(true);
  });
});
