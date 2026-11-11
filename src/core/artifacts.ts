import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { createLogger } from './logger.js';

const execFileAsync = promisify(execFile);
const log = createLogger('artifacts');

export const ARTIFACTS_DIR = path.resolve('reports/artifacts');

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
}

async function readLogcat(): Promise<string> {
  try {
    const { stdout } = await execFileAsync('adb', ['logcat', '-d', '-t', '3000'], {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 20_000,
    });
    return stdout;
  } catch (error) {
    return `Unable to read logcat: ${String(error)}`;
  }
}

/**
 * Dump everything a human (or an LLM) needs to explain a failure:
 * screenshot, current view hierarchy and the tail of logcat.
 */
export async function captureFailureArtifacts(testTitle: string): Promise<string[]> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = path.join(ARTIFACTS_DIR, `${stamp}_${safeName(testTitle)}`);
  const written: string[] = [];

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });

  try {
    const screenshot = await driver.takeScreenshot();
    const file = `${base}.png`;
    await fs.writeFile(file, Buffer.from(screenshot, 'base64'));
    written.push(file);
  } catch (error) {
    log.warn(`Screenshot failed: ${String(error)}`);
  }

  try {
    const source = await driver.getPageSource();
    const file = `${base}.xml`;
    await fs.writeFile(file, source, 'utf8');
    written.push(file);
  } catch (error) {
    log.warn(`Page source failed: ${String(error)}`);
  }

  const logcat = await readLogcat();
  const logFile = `${base}.logcat.txt`;
  await fs.writeFile(logFile, logcat, 'utf8');
  written.push(logFile);

  log.info(`Artifacts for "${testTitle}": ${written.join(', ')}`);
  return written;
}
