/**
 * AES-256-CBC 加解密工具
 * 从 @/lib/providers/api-client 提取为独立模块（解除与 AI 提供商逻辑的耦合）
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * 获取 AES-256-CBC 加密密钥
 * 使用 scryptSync 从 KEY_VAULTS_SECRET 派生 32 字节密钥
 * 注意：只在函数被实际调用时检查 env，避免模块加载时（如构建阶段）阻断
 */
export function getEncryptionKey(): Buffer {
  const keyStr = process.env.KEY_VAULTS_SECRET;
  if (!keyStr) {
    throw new Error('KEY_VAULTS_SECRET 环境变量未设置，无法执行加解密操作');
  }
  return scryptSync(keyStr, 'autocodellm-key-salt', 32);
}

/**
 * AES-256-CBC 加密
 */
export function encryptValue(value: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密
 */
export function decryptValue(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(':');
  const ivHex = parts[0];
  const encryptedData = parts[1];
  if (!ivHex || !encryptedData) {
    throw new Error('无效的加密数据格式');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
