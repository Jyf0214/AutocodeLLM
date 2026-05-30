import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { requireAuth } from '@/lib/auth';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

interface ImportData {
  projects?: {
    id?: string;
    name: string;
    description?: string;
  }[];
  providers?: {
    id?: string;
    name: string;
    baseUrl: string;
    enabled?: boolean;
    providerType?: string;
    sdkType?: string;
  }[];
  envVars?: {
    key: string;
    value?: string;
    description?: string;
    enabled?: boolean;
  }[];
}

/**
 * POST /api/data/import
 * 导入 JSON 数据（支持覆盖和合并）
 */
export const POST = withApiLogging('POST data/import', async function POST(request: Request) {
  const auth = await requireAuth(request, 'admin');
  if (auth.error) return auth.error;

  const body = (await request.json()) as {
    data?: ImportData;
    mode?: 'merge' | 'overwrite';
  };

  if (body.data == null) {
    return NextResponse.json(
      { success: false, error: { message: '缺少导入数据', code: 'MISSING_DATA' } },
      { status: 400 },
    );
  }

  const mode = body.mode ?? 'merge';
  const progress: string[] = [];
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  const { data } = body;

  const db = await getPrisma();

  // 导入项目
  if (data.projects?.length) {
    if (mode === 'overwrite') {
      await db.project.deleteMany();
      progress.push('已清除现有项目');
    }
    for (const ws of data.projects) {
      try {
        if (mode === 'merge' && ws.id) {
          await db.project.upsert({
            where: { id: ws.id },
            update: { name: ws.name, description: ws.description ?? '' },
            create: { name: ws.name, description: ws.description ?? '' },
          });
        } else {
          await db.project.create({
            data: { name: ws.name, description: ws.description ?? '' },
          });
        }
        imported++;
        progress.push(`项目 "${ws.name}" 导入成功`);
      } catch (err) {
        failed++;
        progress.push(`项目 "${ws.name}" 导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    }
  }

  // 导入提供商
  if (data.providers?.length) {
    if (mode === 'overwrite') {
      // 使用事务包装 deleteMany + 批量创建，确保原子性
      await db.$transaction(async (tx) => {
        await tx.provider.deleteMany();
        progress.push('已清除现有提供商');

        for (const p of data.providers ?? []) {
          // 如果没有提供 apiKey，跳过创建而不是创建空 apiKey 的记录
          if (!p.apiKey) {
            skipped++;
            progress.push(`提供商 "${p.name}" 跳过：缺少 apiKey`);
            continue;
          }

          try {
            await tx.provider.create({
              data: {
                name: p.name,
                baseUrl: p.baseUrl,
                apiKey: p.apiKey,
                enabled: p.enabled ?? true,
                providerType: p.providerType ?? 'custom',
                sdkType: p.sdkType ?? 'openai',
              },
            });
            imported++;
            progress.push(`提供商 "${p.name}" 导入成功`);
          } catch (err) {
            failed++;
            progress.push(`提供商 "${p.name}" 导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
          }
        }
      });
    } else {
      // merge 模式：逐条处理
      for (const p of data.providers) {
        try {
          const existing = await db.provider.findUnique({ where: { name: p.name } });
          if (existing) {
            await db.provider.update({
              where: { name: p.name },
              data: { baseUrl: p.baseUrl, enabled: p.enabled ?? true },
            });
            skipped++;
            continue;
          }

          // 新增提供商时，如果没有 apiKey 则跳过创建
          if (!p.apiKey) {
            skipped++;
            progress.push(`提供商 "${p.name}" 跳过：缺少 apiKey`);
            continue;
          }

          await db.provider.create({
            data: {
              name: p.name,
              baseUrl: p.baseUrl,
              apiKey: p.apiKey,
              enabled: p.enabled ?? true,
              providerType: p.providerType ?? 'custom',
              sdkType: p.sdkType ?? 'openai',
            },
          });
          imported++;
          progress.push(`提供商 "${p.name}" 导入成功`);
        } catch (err) {
          failed++;
          progress.push(`提供商 "${p.name}" 导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }
    }
  }

  // 导入环境变量
  if (data.envVars?.length) {
    if (mode === 'overwrite') {
      await db.environmentVariable.deleteMany();
      progress.push('已清除现有环境变量');
    }
    for (const ev of data.envVars) {
      try {
        if (mode === 'merge') {
          const existing = await db.environmentVariable.findUnique({ where: { key: ev.key } });
          if (existing) {
            await db.environmentVariable.update({
              where: { key: ev.key },
              data: { description: ev.description ?? '', enabled: ev.enabled ?? true },
            });
            skipped++;
            continue;
          }
        }
        await db.environmentVariable.create({
          data: {
            key: ev.key,
            value: ev.value ?? '',
            description: ev.description ?? '',
            enabled: ev.enabled ?? true,
          },
        });
        imported++;
        progress.push(`环境变量 "${ev.key}" 导入成功`);
      } catch (err) {
        failed++;
        progress.push(`环境变量 "${ev.key}" 导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    }
  }



  return NextResponse.json({
    success: true,
    data: {
      imported,
      skipped,
      failed,
      total: imported + skipped + failed,
      progress,
    },
  });
});