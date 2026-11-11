# APK Mobile Automation

Open-source test automation framework for **native Android apps (.apk)**, built with
**TypeScript + WebdriverIO 10 + Appium 3 (UiAutomator2)**.

## Installed toolchain (user-scope, no admin required)

| Component | Version | Location |
| --- | --- | --- |
| Node.js | v22.23.4 | `%LOCALAPPDATA%\Programs\node22` |
| JDK (Temurin) | 17.0.21 | `%LOCALAPPDATA%\Programs\jdk17` |
| Android SDK | platform 35, build-tools 35, platform-tools 37.0.1 | `%LOCALAPPDATA%\Android\Sdk` |
| Android emulator + system image | API 35 `google_apis/x86_64` | `%ANDROID_HOME%` |
| AVD | `Pixel_API_35` | `%USERPROFILE%\.android\avd` |

`JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` and the relevant `PATH` entries are set at
user scope. **Open a new terminal** after the first install so they take effect.

## Quickstart

```bash
cp .env.example .env      # then set APP_PATH if you are testing your own app
npm install
npm run appium:driver     # installs the UiAutomator2 driver once
npm run fetch:app         # downloads an open-source demo APK (skip if you have yours)
npm run emulator:start    # boots the Pixel_API_35 AVD
npm run test:regression   # runs TC-001 (checkout) and TC-002 (logout)
```

If the emulator will not start, check acceleration:

```bash
emulator -accel-check
```

If you see **"System UI isn't responding"** immediately after boot, that is a cold-boot ANR of
`com.android.systemui` (its keyguard service) under software rendering - not a fault in your
tests, and not something Android Studio would fix. `emulator:start` defaults to `-gpu host`
because that eliminates it. On a machine with no usable GPU, or in CI, fall back to:

```bash
npm run emulator:start -- --gpu swiftshader_indirect
```

## Pointing it at your app

1. Drop your build into `apps/` (gitignored), e.g. `apps/myapp-debug.apk`.
2. Set `APP_PATH=apps/myapp-debug.apk` in `.env`.
3. Leave `APP_PACKAGE`/`APP_ACTIVITY` empty and Appium will detect the launchable
   activity, or set them explicitly if the app has several entry points.
4. Inspect your app's real selectors with Appium Inspector:

```bash
npx appium inspector
```

## Layout

```
src/
  config/   env validation (zod) + Appium capabilities
  core/     waits, gestures, failure artifacts (screenshot + hierarchy + logcat), logger
  pages/    screen objects - extend BaseScreen, declare a load marker
tests/
  android/regression/  end-to-end journeys: TC-001 checkout, TC-002 logout
scripts/    emulator start/stop, demo app download
```

## Writing a test

```ts
import { BaseScreen } from '../../src/pages/base.screen.js';

class LoginScreen extends BaseScreen {
  protected readonly marker = '~loginScreen';
  async login(user: string, pass: string) {
    await this.type('~username', user);
    await this.type('~password', pass);
    await this.tap('~loginButton');
  }
}
```

Prefer **accessibility ids** (`~id`) and **resource-ids** over XPath: they survive
layout changes and app releases.

## Reports

Every run writes:

- `reports/html/index.html` - self-contained HTML report with logs and screenshots
- `reports/junit/wdio-*.xml` - JUnit XML for CI
- `reports/artifacts/` - on failure: screenshot (`.png`), view hierarchy (`.xml`) and
  logcat tail (`.logcat.txt`), enough to explain a failure without re-running it

## Scope

Android only. iOS (`.ipa`) needs XCUITest on macOS - the capabilities layer is kept
separate (`src/config/capabilities.android.ts`) so an `ios` counterpart can be added
without touching tests.

## Continuous integration

`.github/workflows/daily-android-tests.yml` boots a fresh API 35 emulator and
runs both test cases daily at 03:10 UTC, plus on every push to `main` and on
demand from the Actions tab.

Results are published with Allure:

- `allure-report/` - rendered report, deployed to GitHub Pages (enable
  Settings -> Pages -> Source "GitHub Actions" once)
- `allure-results/` - raw results, re-generatable later
- `reports/artifacts/` - failure screenshots, view hierarchy and logcat

Local usage:

```bash
npm run test:regression    # also writes allure-results/
npm run allure:generate    # -> allure-report/index.html
npm run allure:open        # serve it
```
