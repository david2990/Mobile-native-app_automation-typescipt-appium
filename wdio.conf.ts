import fs from 'node:fs';
import path from 'node:path';
import { ReportAggregator } from '@wdio/html-reporter';
import type { Options } from '@wdio/types';
import { ensureToolchain } from './src/config/toolchain.js';
import { captureFailureArtifacts } from './src/core/artifacts.js';
import { createLogger } from './src/core/logger.js';
import { androidCapabilities } from './src/config/capabilities.android.js';
import { env, isCI } from './src/config/environment.js';

// Must run before the Appium service spawns - it needs JAVA_HOME and adb.
ensureToolchain();

const log = createLogger('wdio');
const REPORTS = path.resolve('reports');

type FrameworkConfig = Options.Testrunner & {
  capabilities: WebdriverIO.Capabilities[];
};

/** Each worker writes JSON; this aggregates them into one HTML report. */
let reportAggregator: ReportAggregator | undefined;

export const config: FrameworkConfig = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',

  specs: ['./tests/**/*.spec.ts'],
  exclude: [],
  maxInstances: env.MAX_INSTANCES,
  capabilities: androidCapabilities(),

  logLevel: 'info',
  bail: 0,
  waitforTimeout: env.EXPLICIT_WAIT_MS,
  connectionRetryTimeout: 180_000,
  connectionRetryCount: 2,

  services: [
    [
      'appium',
      {
        args: {
          address: env.APPIUM_HOST,
          port: env.APPIUM_PORT,
        },
        logPath: path.join(REPORTS, 'appium'),
        // Appium 3 cold start regularly exceeds the 30s default on Windows.
        appiumStartTimeout: 120_000,
      },
    ],
  ],

  framework: 'mocha',
  reporters: [
    'spec',
    ['html', { outputDir: path.join(REPORTS, 'html') }],
    [
      'junit',
      {
        outputDir: path.join(REPORTS, 'junit'),
        // CI expects .xml, the reporter defaults to .log
        outputFileFormat: (options) => `wdio-${options.cid}.xml`,
      },
    ],
  ],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120_000,
    retries: isCI ? 2 : 0,
  },

  onPrepare(): void {
    for (const dir of ['html', 'junit', 'appium', 'artifacts']) {
      fs.mkdirSync(path.join(REPORTS, dir), { recursive: true });
    }
    reportAggregator = new ReportAggregator({
      outputDir: path.join(REPORTS, 'html'),
      filename: 'index.html',
      reportTitle: 'APK Mobile Automation',
      linkScreenshots: true,
      collapseTests: true,
    });

    log.info(`Running against device "${env.DEVICE_NAME}" with APK ${env.APP_PATH}`);
  },

  async onComplete(): Promise<void> {
    await reportAggregator?.createReport();
  },

  afterTest: async function (test, _context, result) {
    if (!result.error) return;
    const title = `${test.parent ?? ''} ${test.title ?? 'unnamed'}`.trim();
    log.warn(`Test failed: ${title}`);
    try {
      await captureFailureArtifacts(title);
    } catch (error) {
      log.error(`Artifact capture failed: ${String(error)}`);
    }
  },
};
