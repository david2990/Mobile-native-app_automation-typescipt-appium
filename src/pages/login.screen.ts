import type { ChainablePromiseElement } from 'webdriverio';
import { BaseScreen } from './base.screen.js';
import { byDesc, byResourceId } from './locators.js';
import { hideKeyboard } from '../core/gestures.js';
import { waitForVisible } from '../core/waits.js';

/**
 * Login screen, reached from the drawer or when checkout is attempted while
 * signed out. The demo accounts are bod@example.com and alice@example.com,
 * both with password 10203040.
 */
export class LoginScreen extends BaseScreen {
  protected readonly marker = byResourceId('loginBtn');

  async login(username: string, password: string): Promise<void> {
    await waitForVisible($(byResourceId('nameET')));

    await this.enter($(byResourceId('nameET')), username, 'Username');
    await this.enter($(byResourceId('passwordET')), password, 'Password');

    // With a hardware keyboard enabled the soft keyboard may never appear, and
    // when it does the submit button can sit underneath the IME.
    await hideKeyboard();

    const submit = $(byDesc('Tap to login with given credentials'));
    await waitForVisible(submit);
    await submit.click();

    // Wait for the form to leave the hierarchy instead of re-clicking: a second
    // tap lands on whatever screen the first one navigated to.
    try {
      await driver.waitUntil(async () => !(await $(byResourceId('loginBtn')).isExisting()), {
        timeout: 15_000,
        interval: 500,
        timeoutMsg: 'The login screen is still displayed after submitting credentials',
      });
    } catch {
      const typedUser = await $(byResourceId('nameET')).getText().catch(() => '<unreadable>');
      const keyboard = await driver.isKeyboardShown().catch(() => false);
      throw new Error(
        `Login did not complete for "${username}". ` +
          `Username field shows "${typedUser}", keyboard shown: ${keyboard}`,
      );
    }
  }

  /**
   * Type into a field and confirm it took.
   *
   * An empty Android EditText reports its hint as its text, so a naive
   * "is there text?" check passes on a field that was never filled - which is
   * how a whole login can silently fail.
   */
  private async enter(
    field: ChainablePromiseElement,
    value: string,
    hint: string,
  ): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await field.click();
      await field.setValue(value);

      const typed = (await field.getText().catch(() => '')).trim();
      if (typed && typed !== hint) return;
    }

    throw new Error(`Could not type "${value}" into the field hinted "${hint}"`);
  }
}
