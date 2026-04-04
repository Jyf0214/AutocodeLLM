/**
 * 初始化持久化目录
 */

import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';

export function isDocker() {
  try {
    return existsSync('/.dockerenv');
  } catch {
    return false;
  }
}

export function initPersistentDirs() {
  const baseDir = process.env.PERSISTENT_DIR || `${homedir()}/.autocodellm`;

  const dirs = [
    baseDir,
    `${baseDir}/workspaces`,
    `${baseDir}/skills`,
    `${baseDir}/config`,
    `${baseDir}/logs`,
    `${baseDir}/backups`,
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`  创建目录: ${dir}`);
    } else {
      console.log(`  目录已存在: ${dir}`);
    }
  }
}
