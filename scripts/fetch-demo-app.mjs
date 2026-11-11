#!/usr/bin/env node
/**
 * Download an open-source demo APK so the framework can be exercised before
 * the real app is available. Tries a few well-known public repos.
 *
 *   npm run fetch:app
 */
import fs from 'node:fs';
import path from 'node:path';

const TARGET = path.resolve(process.env.APP_PATH ?? 'apps/app-under-test.apk');

const CANDIDATES = [
  { repo: 'saucelabs/my-demo-app-android', label: 'Sauce Labs My Demo App' },
  { repo: 'appium/android-apidemos', label: 'Android ApiDemos (Appium)' },
];

const headers = { 'User-Agent': 'apk-mobile-automation', Accept: 'application/vnd.github+json' };

async function findApk(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
  if (!response.ok) return undefined;
  const release = await response.json();
  const asset = (release.assets ?? []).find((a) => a.name?.toLowerCase().endsWith('.apk'));
  return asset ? { url: asset.browser_download_url, name: asset.name, tag: release.tag_name } : undefined;
}

await fs.promises.mkdir(path.dirname(TARGET), { recursive: true });

for (const candidate of CANDIDATES) {
  try {
    const asset = await findApk(candidate.repo);
    if (!asset) {
      console.log(`- ${candidate.label}: no .apk asset in latest release, trying next`);
      continue;
    }
    console.log(`Downloading ${candidate.label} ${asset.tag} -> ${TARGET}`);
    const download = await fetch(asset.url, { headers });
    if (!download.ok) throw new Error(`HTTP ${download.status}`);
    await fs.promises.writeFile(TARGET, Buffer.from(await download.arrayBuffer()));
    const size = (await fs.promises.stat(TARGET)).size;
    console.log(`Done: ${(size / 1024 / 1024).toFixed(1)} MB from ${asset.name}`);
    process.exit(0);
  } catch (error) {
    console.log(`- ${candidate.label} failed: ${String(error)}`);
  }
}

console.error(
  'Could not download a demo APK. Drop your own .apk into apps/ and set APP_PATH in .env',
);
process.exit(1);
