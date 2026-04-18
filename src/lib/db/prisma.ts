/**
 * Prisma 数据库客户端
 * 提供全局单例的数据库连接
 */

import { PrismaClient } from '@prisma/client';

/**
 * 全局单例模式确保开发环境下不会重复创建连接
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * 创建并导出 Prisma 客户端实例
 * 配置日志和连接选项
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// 开发环境下保存全局引用
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
