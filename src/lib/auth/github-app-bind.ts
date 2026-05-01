/**
 * GitHub App 账户绑定模块
 * 处理 GitHub 账号与现有账户的绑定
 */
import { prisma } from '@/lib/db/prisma';

export interface BindVerificationCode {
  code: string;
  userId: string;
  githubUserId: number;
  githubUsername: string;
  expiresAt: Date;
}

// 存储验证码（生产环境应使用 Redis）
const verificationCodes = new Map<string, BindVerificationCode>();

/**
 * 生成6位验证码
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 创建绑定验证码
 * 返回验证码，需要通过终端/邮件发送给用户
 */
export async function createBindVerification(
  userId: string,
  githubUserId: number,
  githubUsername: string
): Promise<string> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟有效期

  verificationCodes.set(code, {
    code,
    userId,
    githubUserId,
    githubUsername,
    expiresAt,
  });

  // 终端输出验证码（用户要求先实现终端输出）
  console.log('\n========================================');
  console.log('GitHub App 绑定验证码');
  console.log('========================================');
  console.log(`用户: ${userId}`);
  console.log(`GitHub: ${githubUsername} (ID: ${githubUserId})`);
  console.log(`验证码: ${code}`);
  console.log(`有效期: 10分钟`);
  console.log('========================================\n');

  return code;
}

/**
 * 验证绑定验证码
 */
export async function verifyBindCode(
  code: string,
  githubUserId: number
): Promise<{ success: boolean; userId?: string; message?: string }> {
  const record = verificationCodes.get(code);

  if (!record) {
    return { success: false, message: '验证码不存在或已过期' };
  }

  if (record.githubUserId !== githubUserId) {
    return { success: false, message: '验证码与 GitHub 账号不匹配' };
  }

  if (new Date() > record.expiresAt) {
    verificationCodes.delete(code);
    return { success: false, message: '验证码已过期' };
  }

  // 验证成功，清理验证码
  verificationCodes.delete(code);

  return { success: true, userId: record.userId };
}

/**
 * 绑定 GitHub 账号到用户
 */
export async function bindGitHubToUser(
  userId: string,
  githubUserId: number,
  githubUsername: string
): Promise<boolean> {
  try {
    // 检查该 GitHub 账号是否已被其他用户绑定
    const existingUser = await prisma.user.findFirst({
      where: { username: `github_${githubUserId}` },
    });

    if (existingUser && existingUser.id !== userId) {
      return false; // 已被其他用户绑定
    }

    // 更新用户的 username 为 github_ 格式（如果还没有）
    await prisma.user.update({
      where: { id: userId },
      data: {
        username: `github_${githubUserId}`,
      },
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * 清理过期的验证码
 */
export function cleanupExpiredCodes() {
  const now = new Date();
  for (const [code, record] of verificationCodes.entries()) {
    if (now > record.expiresAt) {
      verificationCodes.delete(code);
    }
  }
}

// 每分钟清理一次过期验证码
setInterval(cleanupExpiredCodes, 60 * 1000);
