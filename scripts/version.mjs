#!/usr/bin/env node

/**
 * 生成版本号并写入文件
 * 格式：v{YYYYMMDD}-{short_sha}
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function generateVersion() {
  const date = new Date();
  const dateStr = date.toISOString().replace(/[-:T.]/g, '').slice(0, 8);

  let shortSha = 'unknown';
  try {
    shortSha = execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    shortSha = 'nogit';
  }

  return `v${dateStr}-${shortSha}`;
}

const version = generateVersion();
console.log(`Generated version: ${version}`);

// 写入 .version 文件
try {
  const versionPath = join(process.cwd(), '.version');
  writeFileSync(versionPath, `${version}\n`);
  console.log(`Version written to ${versionPath}`);
} catch (err) {
  console.error('Failed to write version file:', err.message);
}

// 尝试写入 public/version.json（如果 public 目录存在）
try {
  const publicDir = join(process.cwd(), 'public');
  mkdirSync(publicDir, { recursive: true });
  const publicVersionPath = join(publicDir, 'version.json');
  writeFileSync(publicVersionPath, JSON.stringify({ version, buildTime: new Date().toISOString() }, null, 2));
  console.log(`Version written to ${publicVersionPath}`);
} catch (err) {
  // public 目录可能不存在，忽略
}
