/**
 * 数据库健康检查工具
 * 用于验证数据库连接和迁移状态
 */

import { prisma } from './prisma';

async function healthCheck() {
  console.log('开始数据库健康检查...\n');

  try {
    // 1. 测试连接
    console.log('1️⃣  测试数据库连接...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ 数据库连接正常\n');

    // 2. 检查迁移状态
    console.log('2️⃣  检查数据表...');
    const tables = await prisma.$queryRaw<
      { Tables_in_autocodellm: string }[]
    >`SHOW TABLES`;

    if (tables.length === 0) {
      console.log('   ⚠️  数据表为空，请运行迁移');
    } else {
      const count = tables.length;
      console.log(`   ✅ 找到 ${String(count)} 个数据表:`);
      for (const t of tables) {
        console.log(`      - ${t.Tables_in_autocodellm}`);
      }
    }
    console.log();

    // 3. 检查用户数据
    console.log('3️⃣  检查用户数据...');
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('   ⚠️  无用户数据，请运行初始化脚本');
    } else {
      console.log(`   ✅ 找到 ${String(userCount)} 个用户`);
    }
    console.log();

    // 4. 检查配置
    console.log('4️⃣  检查聊天配置...');
    const configCount = await prisma.chatConfig.count();
    if (configCount === 0) {
      console.log('   ⚠️  无聊天配置，请运行初始化脚本');
    } else {
      console.log(`   ✅ 找到 ${String(configCount)} 个配置`);
    }
    console.log();

    console.log('========================================');
    console.log('✅ 数据库健康检查完成');
    console.log('========================================');
    process.exit(0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ 数据库健康检查失败:', message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck();
