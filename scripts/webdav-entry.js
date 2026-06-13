#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Jyf0214
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * AutocodeLLM Docker 入口点
 *
 * 职责：
 * 1. 验证 QWEN_SERVER_TOKEN 是否存在
 * 2. 若配置了 WebDAV，启动时从远程恢复 ~/.qwen
 * 3. 每 10 分钟同步 ~/.qwen 到 WebDAV（时间戳文件夹）
 * 4. 启动 qwen serve --token $QWEN_SERVER_TOKEN
 */

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import {
  getConfig,
  getLatestBackup,
  downloadDir,
  uploadDir,
  generateBackupName,
} from './webdav-sync.js';

const QWEN_DIR = join(homedir(), '.qwen');
const SYNC_INTERVAL = 10 * 60 * 1000; // 10 分钟

/* ── Step 1: 读取 Token ───────────────────────────────── */

function getToken() {
  const token = process.env.QWEN_SERVER_TOKEN;
  if (token && token.trim() !== '') {
    console.log('[entry] ✅ Token 已设置，启用 Bearer 鉴权');
    return token.trim();
  }
  console.log('[entry] ⚠️  QWEN_SERVER_TOKEN 未设置，开放访问模式');
  return null;
}

/* ── Step 2: WebDAV 启动恢复 ──────────────────────────── */

async function restoreFromWebDAV() {
  if (!getConfig()) {
    console.log('[entry] WebDAV 未配置，跳过远程恢复');
    return false;
  }

  try {
    const latestDir = await getLatestBackup();
    if (!latestDir) {
      console.log('[entry] 远程没有找到备份，跳过恢复');
      return false;
    }

    console.log(`[entry] 发现远程备份: ${latestDir}`);
    console.log(`[entry] 正在下载到 ${QWEN_DIR} ...`);

    const result = await downloadDir(latestDir, QWEN_DIR);

    if (result.files > 0) {
      console.log(
        `[entry] ✅ 已恢复 ${result.files} 个文件, ${result.dirs} 个目录`,
      );
    } else {
      console.log('[entry] 远程备份为空目录，跳过恢复');
    }
    return true;
  } catch (err) {
    console.error('[entry] WebDAV 恢复失败:', err.message);
    console.error('[entry] 将继续启动，不恢复远程数据');
    return false;
  }
}

/* ── Step 3: 同步到 WebDAV ────────────────────────────── */

let syncTimer = null;
let isSyncing = false;

async function syncToWebDAV() {
  if (isSyncing) {
    console.log('[webdav] 上一次同步尚未完成，跳过本次');
    return;
  }

  if (!getConfig()) return;
  if (!existsSync(QWEN_DIR)) {
    console.log('[webdav] ~/.qwen 目录不存在，跳过同步');
    return;
  }

  isSyncing = true;
  const name = generateBackupName();
  console.log(`[webdav] 开始同步到 ${name} ...`);

  try {
    const result = await uploadDir(QWEN_DIR, name);
    console.log(
      `[webdav] ✅ 同步完成: ${result.files} 文件, ${result.dirs} 目录 → ${name}`,
    );
  } catch (err) {
    console.error(`[webdav] ❌ 同步失败:`, err.message);
  } finally {
    isSyncing = false;
  }
}

function startPeriodicSync() {
  if (!getConfig()) return;
  console.log(`[entry] 启动周期性同步（每 ${SYNC_INTERVAL / 1000 / 60} 分钟）`);

  // 立即执行一次
  syncToWebDAV();

  syncTimer = setInterval(syncToWebDAV, SYNC_INTERVAL);
  syncTimer.unref(); // 不阻止进程退出
}

function stopPeriodicSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

/* ── Step 4: 启动 qwen serve ──────────────────────────── */

function startQwenServe(token) {
  return new Promise((resolve, reject) => {
    const args = ['serve', '--port', '4170', '--hostname', '0.0.0.0'];

    if (token) {
      args.push('--token', token, '--require-auth');
    }

    console.log(`[entry] 启动 qwen ${args.join(' ')}`);

    const child = spawn('qwen', args, {
      stdio: 'inherit',
      env: { ...process.env },
    });

    child.on('error', (err) => {
      console.error('[entry] ❌ 启动 qwen 失败:', err.message);
      reject(err);
    });

    child.on('close', (code) => {
      console.log(`[entry] qwen 进程退出，code=${code}`);
      resolve(code);
    });

    // 捕获退出信号，先同步再退出
    const shutdown = async () => {
      console.log('[entry] 收到退出信号，执行最后一次同步...');
      stopPeriodicSync();
      await syncToWebDAV().catch(() => {});
      child.kill();
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  });
}

/* ── Main ─────────────────────────────────────────────── */

async function main() {
  try {
    const token = getToken();

    // 从 WebDAV 恢复
    await restoreFromWebDAV();

    // 启动周期性同步
    startPeriodicSync();

    // 启动 qwen serve（阻塞直到退出）
    const exitCode = await startQwenServe(token);

    // qwen 退出后做一次最终同步
    console.log('[entry] qwen 已退出，执行最终同步...');
    stopPeriodicSync();
    await syncToWebDAV().catch(() => {});

    process.exit(exitCode ?? 0);
  } catch (err) {
    console.error('[entry] ❌ 致命错误:', err.message);
    process.exit(1);
  }
}

main();
