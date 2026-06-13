/**
 * 延迟获取 Prisma 客户端
 *
 * 使用动态导入避免在 Next.js 构建时触发 PrismaClient 初始化，
 * 确保数据库连接只在运行时建立。
 *
 * 所有需要使用数据库的 API 路由应从本模块导入此函数，
 * 而不是在每个文件中重复定义。
 */

export async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}
