#!/usr/bin/env node
/**
 * Start / stop the Android emulator for the AVD named in DEVICE_NAME.
 *
 *   node scripts/emulator.mjs start
 *   node scripts/emulator.mjs start --gpu swiftshader_indirect
 *   node scripts/emulator.mjs stop
 *
 * GPU mode defaults to "host" because software rendering (swiftshader) makes
 * SystemUI miss its ANR deadline on cold boot: "System UI isn't responding".
 * Pass --gpu swiftshader_indirect on machines without a usable GPU or in CI.
 */
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const action = (process.argv[2] ?? 'start').toLowerCase();
const gpuFlag = process.argv.indexOf('--gpu');
const gpuMode =
  gpuFlag > -1 && process.argv[gpuFlag + 1]
    ? process.argv[gpuFlag + 1]
    : (process.env.EMU_GPU ?? 'host');
const avdName = process.env.DEVICE_NAME ?? 'Pixel_API_35';
const sdkRoot = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
const emulatorBin = sdkRoot
  ? path.join(sdkRoot, 'emulator', process.platform === 'win32' ? 'emulator.exe' : 'emulator')
  : 'emulator';
const adb = sdkRoot
  ? path.join(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')
  : 'adb';

// stderr is swallowed: adb writes "device offline" there while the AVD boots.
function adbOut(args) {
  return execFileSync(adb, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function serial() {
  try {
    const line = adbOut(['devices'])
      .split(/\r?\n/)
      .find((l) => l.startsWith('emulator-'));
    return line?.split(/\s+/)[0];
  } catch {
    return undefined;
  }
}

async function bootCompleted(srl) {
  try {
    return adbOut(['-s', srl, 'shell', 'getprop', 'sys.boot_completed']).trim() === '1';
  } catch {
    return false;
  }
}

async function start() {
  if (!fs.existsSync(emulatorBin) && !sdkRoot) {
    console.error('ANDROID_HOME is not set and emulator is not on PATH.');
    process.exit(1);
  }

  const existing = serial();
  if (existing) {
    console.log(`Emulator already running on ${existing}`);
    return;
  }

  console.log(`Booting AVD "${avdName}" (gpu: ${gpuMode})...`);
  const child = spawn(
    emulatorBin,
    [
      '-avd',
      avdName,
      '-no-snapshot-save',
      '-no-boot-anim',
      '-no-audio',
      '-gpu',
      gpuMode,
    ],
    { detached: true, stdio: 'ignore' },
  );
  child.unref();

  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const srl = serial();
    if (srl && (await bootCompleted(srl))) {
      console.log(`Emulator ready: ${srl}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
  console.error('Emulator did not finish booting within 180s.');
  process.exit(1);
}

function stop() {
  const srl = serial();
  if (!srl) {
    console.log('No emulator is running.');
    return;
  }
  console.log(`Stopping ${srl}...`);
  try {
    adbOut(['-s', srl, 'emu', 'kill']);
  } catch {
    execFileSync('taskkill', ['/IM', 'qemu-system-x86_64.exe', '/F'], { stdio: 'ignore' });
  }
  console.log('Emulator stopped.');
}

if (action === 'start') await start();
else if (action === 'stop') stop();
else {
  console.error(`Unknown action "${action}". Use "start" or "stop".`);
  process.exit(1);
}
