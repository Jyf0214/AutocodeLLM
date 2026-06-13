#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Jyf0214
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * WebDAV 同步核心模块
 * 基于 Node.js 原生 fetch，无外部依赖
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, dirname, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Minimatch } = require('minimatch');

/* ── 配置 ─────────────────────────────────────────────── */

export function getConfig() {
  const url = process.env.WEBDAV_URL;
  const user = process.env.WEBDAV_USER;
  const pass = process.env.WEBDAV_PASS;

  if (!url) {
    console.log('[webdav] WEBDAV_URL 未设置，跳过远程同步');
    return null;
  }
  if (!user || !pass) {
    console.error('[webdav] WEBDAV_URL 已设置但缺少 WEBDAV_USER/WEBDAV_PASS');
    return null;
  }

  const base = url.replace(/\/+$/, ''); // 去掉尾部斜杠
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');

  return { base, auth };
}

/* ── .gitignore 解析与匹配 ────────────────────────────── */

/**
 * 解析 .gitignore 文件，返回规范化后的规则列表。
 * 每条规则: { pattern, negate, dirOnly, anchored }
 */
export function parseGitignore(filePath) {
  if (!existsSync(filePath)) return [];

  const content = readFileSync(filePath, 'utf-8');
  const rules = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    // 空行和注释跳过
    if (!trimmed || trimmed.startsWith('#')) continue;

    let pattern = trimmed;
    let negate = false;

    // 取否定的
    if (pattern.startsWith('!')) {
      negate = true;
      pattern = pattern.slice(1);
    }

    // 去掉首尾空白
    pattern = pattern.trim();
    if (!pattern) continue;

    // 目录限定：尾部 /
    const dirOnly = pattern.endsWith('/');
    if (dirOnly) pattern = pattern.slice(0, -1);

    // 锚定：以 / 开头 → 相对于 root
    const anchored = pattern.startsWith('/');
    if (anchored) pattern = pattern.slice(1);

    rules.push({ pattern, negate, dirOnly, anchored });
  }

  return rules;
}

/**
 * 创建匹配器。对每条规则预编译 Minimatch 实例。
 */
function compileMatcher(rules) {
  return rules.map((r) => ({
    ...r,
    mm: new Minimatch(r.pattern, { dot: true, matchBase: !r.anchored }),
  }));
}

/**
 * 判断一个路径是否被 .gitignore 规则忽略。
 * @param {string} relPath  - 相对于 .gitignore 所在目录的路径（POSIX 风格）
 * @param {boolean} isDir   - 是否是目录
 * @param {Array} compiled  - compileMatcher 的输出
 * @returns {boolean} true = 应该被忽略
 */
export function isIgnored(relPath, isDir, compiled) {
  let ignored = false;

  for (const rule of compiled) {
    // 目录限定：规则只对目录生效
    if (rule.dirOnly && !isDir) continue;

    // minimatch 的 matchBase 控制是否只匹配 basename
    // anchored 为 true 时 matchBase=false 需匹配完整路径
    // anchored 为 false 时 matchBase=true 可匹配任意层级
    const dotSlashPath = relPath.startsWith('/') ? relPath.slice(1) : relPath;

    let matched;
    if (rule.anchored) {
      matched = rule.mm.match(dotSlashPath);
    } else {
      // 非锚定模式：匹配路径任意部分
      // Minimatch .match() 在设置 matchBase 时若路径包含 / 也会尝试匹配 basename
      matched =
        rule.mm.match(dotSlashPath) ||
        rule.mm.match(relPath.split('/').pop() || relPath);
    }

    if (matched) {
      ignored = !rule.negate;
    }
  }

  return ignored;
}

/**
 * 从目录及其父目录加载 .gitignore 规则并编译。
 * 从 dir 开始向上查找，直到找到 .gitignore 或到达根目录。
 */
export function loadGitignore(dir) {
  let current = resolve(dir);
  const allRules = [];

  // 先读当前目录的 .gitignore
  const localGi = join(current, '.gitignore');
  if (existsSync(localGi)) {
    const rules = parseGitignore(localGi);
    allRules.push(...rules);
  }

  // 再往上找 .gitignore（项目级）
  const root = resolve('/');
  while (current !== root) {
    current = dirname(current);
    const gi = join(current, '.gitignore');
    if (existsSync(gi)) {
      const rules = parseGitignore(gi);
      // 父目录的规则不需要 anchored（因为路径是相对于那个目录的）
      // 但我们统一把它作为绝对锚定处理，只要相对路径开头匹配即可
      allRules.push(...rules.map((r) => ({ ...r, anchored: true })));
      // 找到第一个父 .gitignore 就停止，避免过多层级
      break;
    }
    // 如果到了 home 目录还没找到，停止
    if (current === join('/', 'home')) break;
  }

  return allRules.length > 0 ? compileMatcher(allRules) : null;
}

/* ── 低级别 HTTP 请求 ─────────────────────────────────── */

async function webdavRequest(path, method, body = null, depth = '0') {
  const cfg = getConfig();
  if (!cfg) throw new Error('WebDAV 未配置');

  const url = `${cfg.base}${path.startsWith('/') ? path : '/' + path}`;

  const headers = {
    Authorization: `Basic ${cfg.auth}`,
    'User-Agent': 'AutocodeLLM-WebDAV-Sync/1.0',
  };

  if (method === 'PROPFIND') {
    headers['Depth'] = depth;
    headers['Content-Type'] = 'application/xml; charset="utf-8"';
  }

  const res = await fetch(url, { method, headers, body });

  if (res.status === 404) return null;
  if (res.status >= 400) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `WebDAV ${method} ${path} → ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  return res;
}

/* ── 列表目录 ──────────────────────────────────────────── */

export async function listRemote(dirPath = '') {
  const res = await webdavRequest(dirPath, 'PROPFIND', null, '1');
  if (!res) return [];

  const xml = await res.text();
  const items = [];

  // 简单 XML 解析：提取 href 和 collection 标记
  const hrefRegex = /<d:href>([^<]+)<\/d:href>/g;
  const collRegex = /<d:collection\s*\/>/g;

  const hrefs = [];
  let m;
  while ((m = hrefRegex.exec(xml)) !== null) {
    hrefs.push(decodeURIComponent(m[1]));
  }

  const collPositions = [];
  while ((m = collRegex.exec(xml)) !== null) {
    collPositions.push(m.index);
  }

  // 每个 href 对应一个条目，判断是否是目录
  for (let i = 0; i < hrefs.length; i++) {
    const href = hrefs[i];
    // 跳过当前目录自身
    const name = href.replace(/\/$/, '').split('/').pop();
    if (!name) continue;

    // 粗略判断：href 以 / 结尾 + 附近有 d:collection → 目录
    // 简化：只查找 <d:collection 在 href 附近
    const xmlAround = xml.slice(
      Math.max(0, xml.indexOf(hrefs[i]) - 200),
      xml.indexOf(hrefs[i]) + hrefs[i].length + 200,
    );
    const isDir = xmlAround.includes('<d:collection') || href.endsWith('/');

    items.push({
      name,
      path: href,
      isDirectory: isDir,
    });
  }

  return items;
}

/* ── 创建远程目录 ──────────────────────────────────────── */

export async function mkcolRemote(dirPath) {
  try {
    await webdavRequest(dirPath, 'MKCOL');
    return true;
  } catch {
    // 可能已存在
    return false;
  }
}

/* ── 上传文件 ──────────────────────────────────────────── */

export async function uploadFile(localPath, remotePath) {
  const content = readFileSync(localPath);
  const res = await webdavRequest(remotePath, 'PUT', content);
  return res?.status === 200 || res?.status === 201 || res?.status === 204;
}

/* ── 下载文件 ──────────────────────────────────────────── */

export async function downloadFile(remotePath, localPath) {
  const res = await webdavRequest(remotePath, 'GET');
  if (!res) return false;

  const dir = dirname(localPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(localPath, buffer);
  return true;
}

/* ── 删除远程路径 ──────────────────────────────────────── */

export async function deleteRemote(path) {
  try {
    await webdavRequest(path, 'DELETE');
    return true;
  } catch {
    return false;
  }
}

/* ── 递归上传目录 ──────────────────────────────────────── */

export async function uploadDir(localDir, remoteDir) {
  if (!existsSync(localDir)) {
    console.log(`[webdav] 本地目录不存在，跳过: ${localDir}`);
    return { files: 0, dirs: 0 };
  }

  // 加载 .gitignore 规则
  const gitignoreMatcher = loadGitignore(localDir);
  if (gitignoreMatcher) {
    console.log(
      `[webdav] 已加载 .gitignore 规则 (${gitignoreMatcher.length} 条)`,
    );
  }

  // 确保远程目录存在
  await mkcolRemote(remoteDir).catch(() => {});

  let files = 0;
  let dirs = 0;

  async function walk(local, remote) {
    const entries = await readdir(local, { withFileTypes: true });

    for (const entry of entries) {
      const localPath = join(local, entry.name);
      const relPath = relative(localDir, localPath);

      // .gitignore 过滤
      if (
        gitignoreMatcher &&
        isIgnored(relPath, entry.isDirectory(), gitignoreMatcher)
      ) {
        if (entry.isDirectory()) {
          console.log(`[webdav] 跳过忽略的目录: ${relPath}/`);
        }
        continue;
      }

      // 跳过 .gitignore 文件本身（不同步到远程）
      if (entry.name === '.gitignore' && !entry.isDirectory()) continue;

      const remotePath = `${remote}/${encodeURIComponent(entry.name)}`;

      if (entry.isDirectory()) {
        await mkcolRemote(remotePath).catch(() => {});
        dirs++;
        await walk(localPath, remotePath);
      } else if (entry.isFile()) {
        try {
          await uploadFile(localPath, remotePath);
          files++;
        } catch (err) {
          console.error(`[webdav] 上传失败: ${localPath} →`, err.message);
        }
      }
    }
  }

  await walk(localDir, remoteDir);
  return { files, dirs };
}

/* ── 递归下载目录 ──────────────────────────────────────── */

export async function downloadDir(remoteDir, localDir) {
  const items = await listRemote(remoteDir);
  if (!items || items.length === 0) return { files: 0, dirs: 0 };

  let files = 0;
  let dirs = 0;

  for (const item of items) {
    const itemName = item.name;
    if (!itemName || itemName === '.') continue;

    const remotePath = `${remoteDir}/${encodeURIComponent(itemName)}`;
    const localPath = join(localDir, itemName);

    if (item.isDirectory) {
      if (!existsSync(localPath)) mkdirSync(localPath, { recursive: true });
      dirs++;
      const sub = await downloadDir(remotePath, localPath);
      files += sub.files;
      dirs += sub.dirs;
    } else {
      try {
        await downloadFile(remotePath, localPath);
        files++;
      } catch (err) {
        console.error(`[webdav] 下载失败: ${remotePath} →`, err.message);
      }
    }
  }

  return { files, dirs };
}

/* ── 获取最新备份文件夹名 ───────────────────────────────── */

export async function getLatestBackup() {
  const items = await listRemote('');
  if (!items || items.length === 0) return null;

  // 找 qwen-backup- 前缀的目录
  const backups = items
    .filter((i) => i.isDirectory && i.name?.startsWith('qwen-backup-'))
    .sort((a, b) => b.name.localeCompare(a.name)); // 按名字降序（最新在前）

  return backups.length > 0 ? backups[0].name : null;
}

/* ── 生成时间戳文件夹名 ────────────────────────────────── */

export function generateBackupName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `qwen-backup-${iso}`;
}
