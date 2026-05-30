/**
 * 验证码内存存储模块
 *
 * 将验证码 Map 抽取到独立模块，避免循环依赖和跨文件直接引用。
 * login/route.ts 和 verification-code/route.ts 都从此模块导入。
 */

// 登录验证码存储
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

// 绑定验证码存储（12 位）
const bindingCodes = new Map<string, { code: string; expiresAt: number; targetType: string; targetId: string }>();

export { verificationCodes, bindingCodes };
