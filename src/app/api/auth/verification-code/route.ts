import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { randomBytes } from 'node:crypto';
import { verificationCodes } from '../login/route';
import { bindingCodes } from '../bind/route';

// 生成 12 位数字验证码
function generateCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i % bytes.length];
    if (byte !== undefined) {
      code += (byte % 10).toString();
    }
  }
  return code;
}

export const POST = withApiLogging('POST auth/verification-code', async function POST(request: Request) {
  try {
    const body = (await request.json()) as { 
      username: string; 
      forBinding?: boolean;
      targetType?: string;
      targetId?: string;
    };
    const { username, forBinding, targetType, targetId } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: { message: '用户名不能为空', code: 'MISSING_USERNAME' } },
        { status: 400 },
      );
    }

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 分钟过期

    if (forBinding && targetType && targetId) {
      // 绑定验证码
      bindingCodes.set(username, { code, expiresAt, targetType, targetId });
      
      // 打印到服务器控制台
      console.log('\n========================================');
      console.log('  🔐 绑定验证码请求');
      console.log(`  👤 用户名: ${username}`);
      console.log(`  🔢 验证码: ${code}`);
      console.log(`  🎯 绑定类型: ${targetType}`);
      console.log(`  🆔 目标ID: ${targetId}`);
      console.log(`  ⏰ 有效期: 5 分钟`);
      console.log('========================================\n');
    } else {
      // 登录验证码
      verificationCodes.set(username, { code, expiresAt });

      // 打印到服务器控制台
      console.log('\n========================================');
      console.log('  🔐 验证码登录请求');
      console.log(`  👤 用户名: ${username}`);
      console.log(`  🔢 验证码: ${code}`);
      console.log(`  ⏰ 有效期: 5 分钟`);
      console.log('========================================\n');
    }

    return NextResponse.json({
      success: true,
      data: { message: '验证码已生成，请查看服务器控制台' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '验证码生成失败', code: 'CODE_GENERATION_ERROR' } },
      { status: 500 },
    );
  }
});

// 验证验证码
export const GET = withApiLogging('GET auth/verification-code', function GET(request: Request)  {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const code = searchParams.get('code');

    if (!username || !code) {
      return NextResponse.json(
        { success: false, error: { message: '用户名和验证码不能为空', code: 'MISSING_FIELDS' } },
        { status: 400 },
      );
    }

    const stored = verificationCodes.get(username);

    if (!stored) {
      return NextResponse.json(
        { success: false, error: { message: '验证码不存在或已过期', code: 'INVALID_CODE' } },
        { status: 401 },
      );
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(username);
      return NextResponse.json(
        { success: false, error: { message: '验证码已过期', code: 'CODE_EXPIRED' } },
        { status: 401 },
      );
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { success: false, error: { message: '验证码错误', code: 'INVALID_CODE' } },
        { status: 401 },
      );
    }

    // 验证成功，删除验证码
    verificationCodes.delete(username);

    return NextResponse.json({
      success: true,
      data: { message: '验证码验证通过' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '验证码验证失败', code: 'VERIFICATION_ERROR' } },
      { status: 500 },
    );
  }
});
