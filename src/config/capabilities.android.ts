import fs from 'node:fs';
import { appPath, env } from './environment.js';

/**
 * Appium UiAutomator2 capabilities for the APK under test.
 *
 * Defaults are deliberately "hands off": Appium detects the launchable
 * activity from the APK, grants runtime permissions automatically and
 * disables window animations (a major source of flakiness).
 */
export function androidCapabilities(): WebdriverIO.Capabilities[] {
  if (!fs.existsSync(appPath)) {
    throw new Error(
      `APK not found: ${appPath}\n` +
        `Run "npm run fetch:app" to download the open-source demo app, ` +
        `or drop your own .apk into apps/ and set APP_PATH in .env`,
    );
  }

  const capabilities: Record<string, unknown> = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': env.DEVICE_NAME,
    'appium:platformVersion': env.PLATFORM_VERSION,
    'appium:app': appPath,
    'appium:autoGrantPermissions': true,
    'appium:noReset': env.NO_RESET,
    'appium:newCommandTimeout': 300,
    'appium:uiautomator2ServerLaunchTimeout': 120_000,
    'appium:disableWindowAnimation': true,
    'appium:waitForIdleTimeout': 100,
    // Cold starts on an emulator regularly exceed Appium's 20s default,
    // which surfaces as "SplashActivity never started".
    'appium:appWaitDuration': 120_000,
  };

  if (env.DEVICE_UDID) capabilities['appium:udid'] = env.DEVICE_UDID;
  if (env.APP_PACKAGE) capabilities['appium:appPackage'] = env.APP_PACKAGE;
  if (env.APP_ACTIVITY) capabilities['appium:appActivity'] = env.APP_ACTIVITY;

  return [capabilities as WebdriverIO.Capabilities];
}
