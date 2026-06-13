import { successResponse, errorResponse } from '@/lib/api/response';
import { withApiLogging, logPasswordAudit } from '@/lib/log';
import { compareSync, hashSync } from 'bcryptjs';
import { createHash } from 'node:crypto';
import { verificationCodes } from '@/lib/auth/verification-store';
import { getPrisma } from '@/lib/db/get-prisma';
import { signUserId } from '@/lib/auth';


// 登录频率限制：Map<IP, { count: number; lastAttempt: number }>
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 10;          // 最大失败次数
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 分钟窗口（毫秒）
const CODE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 验证码清理间隔（毫秒）

// 惰性启动定时器清理过期验证码（避免模块加载时创建定时器）
let cleanupTimerInitialized = false;
function lazyInitCleanupTimer() {
  if (cleanupTimerInitialized) return;
  cleanupTimerInitialized = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, stored] of verificationCodes) {
      if (now > stored.expiresAt) {
        verificationCodes.delete(key);
      }
    }
  }, CODE_CLEANUP_INTERVAL);
}

export const POST = withApiLogging('POST auth/login', async function POST(request: Request) {
  try {
    // 惰性启动清理定时器（避免模块加载时创建）
    lazyInitCleanupTimer();

    const body = (await request.json()) as {
      username: string;
      password?: string;
      verificationCode?: string;
      useVerificationCode?: boolean;
    };
    const { username, password, verificationCode, useVerificationCode } = body;

    if (!username) {
      return errorResponse('用户名不能为空', 'MISSING_FIELDS', 400);
    }

    // --- 登录频率限制（基于 IP） ---
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (record && now - record.lastAttempt < RATE_LIMIT_WINDOW) {
      if (record.count >= MAX_ATTEMPTS) {
        return errorResponse('登录尝试过于频繁，请 5 分钟后再试', 'RATE_LIMITED', 429);
      }
    } else if (record) {
      // 超出窗口期，重置计数
      loginAttempts.set(ip, { count: 0, lastAttempt: now });
    }

    // 验证码登录模式
    if (useVerificationCode) {
      if (!verificationCode) {
        return errorResponse('请输入验证码', 'MISSING_CODE', 400);
      }

      const stored = verificationCodes.get(username);

      if (!stored) {
        return errorResponse('请先获取验证码', 'NO_CODE_REQUEST', 401);
      }

      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(username);
        return errorResponse('验证码已过期', 'CODE_EXPIRED', 401);
      }

      if (stored.code !== verificationCode) {
        return errorResponse('验证码错误', 'INVALID_CODE', 401);
      }

      // 验证码验证通过，删除验证码
      verificationCodes.delete(username);
    }

    const db = await getPrisma();
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return errorResponse('用户不存在', 'USER_NOT_FOUND', 401);
    }

    // 密码登录模式需要验证密码
    if (!useVerificationCode) {
      if (!password) {
        return errorResponse('密码不能为空', 'MISSING_PASSWORD', 400);
      }

      // 使用 bcrypt 验证密码（替代原来的 SHA-256 无盐哈希）
      if (!compareSync(password, user.passwordHash)) {
        // 向后兼容：检查是否为旧版 SHA-256 无盐哈希
        const sha256Hash = createHash('sha256').update(password).digest('hex');
        if (sha256Hash === user.passwordHash) {
          // 旧版哈希匹配，升级为 bcrypt 哈希
          const newHash = hashSync(password, 10);
          await db.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
          });
          // 继续登录流程（不报错）
        } else {
          // 记录失败次数
          const currentRecord = loginAttempts.get(ip);
          if (currentRecord) {
            currentRecord.count += 1;
          } else {
            loginAttempts.set(ip, { count: 1, lastAttempt: now });
          }

          // 记录审计日志（仅记录 userId/action/success/message，不记录哈希值）
          await logPasswordAudit(db, {
            userId: user.id,
            action: 'LOGIN_FAILED',
            success: false,
            message: '密码错误',
          });

          return errorResponse('密码错误', 'INVALID_CREDENTIALS', 401);
        }
      }

      // 记录登录成功（仅记录 userId/action/success/message，不记录哈希值）
      await logPasswordAudit(db, {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        success: true,
        message: '登录成功',
      });
    }

    // 登录成功后重置该 IP 的失败计数
    loginAttempts.delete(ip);

    const response = successResponse({
      userId: user.id,
      username: user.username,
      role: user.role || 'admin',
      forceChangePassword: user.forceChangePassword,
    });

    // 设置认证 cookie（httpOnly 防止 XSS 窃取、sameSite strict 防止 CSRF）
    response.cookies.set('userId', signUserId(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[Login] login error:', err);
    return errorResponse('登录失败', 'LOGIN_ERROR', 500);
  }
});
