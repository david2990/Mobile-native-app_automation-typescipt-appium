import { BaseScreen } from './base.screen.js';
import { byDesc, byResourceId, byText } from './locators.js';
import { waitForAnyVisible } from '../core/waits.js';

/**
 * Hamburger navigation drawer.
 *
 * The item list is conditional: a signed-out user sees "Log In", a signed-in
 * one sees "Log Out" - which is exactly what the logout test asserts on.
 */
export class MenuScreen extends BaseScreen {
  protected readonly marker = byResourceId('menuRV');

  get loginItem() {
    return $(byDesc('Login Menu Item'));
  }

  get logoutItem() {
    return $(byDesc('Logout Menu Item'));
  }

  /** Open the drawer, unless it is already open. */
  async open(): Promise<void> {
    if (!(await this.root.isExisting())) {
      await this.tap(byDesc('View menu'));
    }
    await this.waitUntilLoaded();
  }

  async isLoggedIn(): Promise<boolean> {
    return this.logoutItem.isExisting();
  }

  async logIn(): Promise<void> {
    const drawer = $(byResourceId('menuRV'));
    await this.tap(byDesc('Login Menu Item'));

    // Wait until the drawer has left the hierarchy, not merely animated out.
    // A closing scrim swallows any tap that arrives while it is still there,
    // which silently leaves the following login form empty.
    await driver.waitUntil(async () => !(await drawer.isExisting()), {
      timeout: 15_000,
      interval: 250,
      timeoutMsg: 'The menu drawer did not close after tapping Log In',
    });
  }

  async logOut(): Promise<void> {
    await this.tap(byDesc('Logout Menu Item'));
  }

  /**
   * Confirm the logout prompt.
   *
   * The dialog is a native alert whose positive button is exposed either as
   * `android:id/button1` or as a button labelled YES/OK, so candidates are
   * tried in order of specificity instead of assuming one wording.
   */
  async confirmLogout(): Promise<void> {
    const confirm = await waitForAnyVisible([
      'android=new UiSelector().resourceId("android:id/button1")',
      byText('LOGOUT'),
      byText('YES'),
      byText('Yes'),
      byText('OK'),
      byText('Log Out'),
      'android=new UiSelector().className("android.widget.Button").instance(0)',
    ]);
    await confirm.click();
  }
}
