import fs from 'node:fs';
import path from 'node:path';
import { createLogger } from '../core/logger.js';

const log = createLogger('toolchain');
const isWindows = process.platform === 'win32';
const JAVA_BIN = isWindows ? 'java.exe' : 'java';

function expandDirs(dir: string, filter: RegExp): string[] {
  try {
    return fs
      .readdirSync(dir)
      .filter((entry) => filter.test(entry))
      .map((entry) => path.join(dir, entry));
  } catch {
    return [];
  }
}

function isJavaHome(candidate: string | undefined): candidate is string {
  return Boolean(candidate) && fs.existsSync(path.join(candidate as string, 'bin', JAVA_BIN));
}

function isAndroidSdk(candidate: string | undefined): candidate is string {
  return Boolean(candidate) && fs.existsSync(path.join(candidate as string, 'platform-tools'));
}

function javaHomeCandidates(): Array<string | undefined> {
  const localAppData = process.env.LOCALAPPDATA;
  const programFiles = process.env.ProgramFiles;

  return [
    process.env.JAVA_HOME,
    ...(localAppData
      ? [
          path.join(localAppData, 'Programs', 'jdk17'),
          ...expandDirs(path.join(localAppData, 'Programs'), /^jdk/i),
        ]
      : []),
    ...(programFiles ? expandDirs(path.join(programFiles, 'Eclipse Adoptium'), /^jdk/i) : []),
  ];
}

function androidHomeCandidates(): Array<string | undefined> {
  const localAppData = process.env.LOCALAPPDATA;
  const userProfile = process.env.USERPROFILE ?? process.env.HOME;

  return [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    ...(localAppData ? [path.join(localAppData, 'Android', 'Sdk')] : []),
    ...(localAppData ? [path.join(localAppData, 'Android', 'sdk')] : []),
    ...(userProfile ? [path.join(userProfile, 'AppData', 'Local', 'Android', 'Sdk')] : []),
  ];
}

function prependPath(entry: string): void {
  const current = process.env.PATH ?? '';
  const parts = current.split(path.delimiter).filter(Boolean);
  if (parts.some((part) => part.toLowerCase() === entry.toLowerCase())) return;
  process.env.PATH = [entry, ...parts].join(path.delimiter);
}

/**
 * Appium shells out to `java` (APK signature checks) and `adb` (device access).
 * A test runner started from an IDE, a service or a fresh CI shell does not
 * always inherit JAVA_HOME/ANDROID_HOME, so resolve them here once and expose
 * them to every child process.
 */
export function ensureToolchain(): { javaHome?: string; androidHome?: string } {
  const javaHome = javaHomeCandidates().find(isJavaHome);
  const androidHome = androidHomeCandidates().find(isAndroidSdk);

  if (javaHome) {
    process.env.JAVA_HOME = javaHome;
    prependPath(path.join(javaHome, 'bin'));
  } else {
    log.warn('No JDK found. Set JAVA_HOME - Appium needs java for APK signature checks.');
  }

  if (androidHome) {
    process.env.ANDROID_HOME = androidHome;
    process.env.ANDROID_SDK_ROOT = androidHome;
    prependPath(path.join(androidHome, 'platform-tools'));
    prependPath(path.join(androidHome, 'emulator'));
  } else {
    log.warn('No Android SDK found. Set ANDROID_HOME - Appium needs adb to reach the device.');
  }

  return { javaHome, androidHome };
}
