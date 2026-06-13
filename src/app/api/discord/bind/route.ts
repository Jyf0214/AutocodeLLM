/**
 * Discord 用户绑定 API
 * POST /api/discord/bind — 通过绑定码确认绑定
 * GET  /api/discord/bind — 获取当前项目的绑定列表
 * DELETE /api/discord/bind — 解绑 Discord 用户
 */
import { withApiLogging } from '@/lib/log';
import {

  successResponse,
  errorResponse,
  handleError,
  parseJsonBody,
  isErrorResponse,
} from '@/lib/api/response';
import { getPrisma } from '@/lib/db/get-prisma';



interface BindRequest {
  code: string;
  projectId: string;
}

/** POST: 通过绑定码确认绑定 */
export const POST = withApiLogging('POST discord/bind', async function POST(request: Request) {
  try {
    const body = await parseJsonBody<BindRequest>(request);
    if (isErrorResponse(body)) return body;

    const { code, projectId } = body;

    if (!code.trim()) {
      return errorResponse('绑定码不能为空', 'EMPTY_CODE', 400);
    }
    if (!projectId.trim()) {
      return errorResponse('项目 ID 不能为空', 'EMPTY_PROJECT', 400);
    }

    // 验证项目存在
    const db = await getPrisma();
    const project = await db.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return errorResponse('项目不存在', 'PROJECT_NOT_FOUND', 404);
    }

    // 查找绑定码对应的记录
    const binding = await db.discordBinding.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!binding) {
      return errorResponse('绑定码无效', 'CODE_NOT_FOUND', 404);
    }

    // 检查绑定码是否过期
    if (binding.codeExpiresAt && binding.codeExpiresAt < new Date()) {
      // 清理过期记录
      await db.discordBinding.delete({ where: { id: binding.id } });
      return errorResponse('绑定码已过期，请在 Discord 重新输入 /connect', 'CODE_EXPIRED', 410);
    }

    // 检查该 Discord 用户是否已绑定其他项目
    const existingBinding = await db.discordBinding.findUnique({
      where: { discordUserId: binding.discordUserId },
    });

    if (existingBinding && existingBinding.id !== binding.id && !existingBinding.code) {
      return errorResponse(
        `该 Discord 用户已绑定到其他项目，请先解绑`,
        'ALREADY_BOUND',
        409,
      );
    }

    // 完成绑定：更新 projectId 并清除绑定码
    await db.discordBinding.update({
      where: { id: binding.id },
      data: {
        projectId,
        code: null,
        codeExpiresAt: null,
      },
    });

    return successResponse({
      discordUserId: binding.discordUserId,
      discordUserName: binding.discordUserName,
      projectId,
      projectName: project.name,
    });
  } catch (error) {
    return handleError(error, 'Discord 绑定');
  }
});

/** GET: 获取项目的绑定列表 */
export const GET = withApiLogging('GET discord/bind', async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return errorResponse('projectId 参数必填', 'MISSING_PROJECT_ID', 400);
    }

    const db = await getPrisma();
    const bindings = await db.discordBinding.findMany({
      where: { projectId, code: null }, // 仅返回已完成绑定的
      select: {
        id: true,
        discordUserId: true,
        discordUserName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(bindings);
  } catch (error) {
    return handleError(error, '获取绑定列表');
  }
});

/** DELETE: 解绑 Discord 用户 */
export const DELETE = withApiLogging('DELETE discord/bind', async function DELETE(request: Request) {
  try {
    const body = await parseJsonBody<{ discordUserId: string }>(request);
    if (isErrorResponse(body)) return body;

    if (!body.discordUserId) {
      return errorResponse('discordUserId 不能为空', 'EMPTY_DISCORD_USER_ID', 400);
    }

    const db = await getPrisma();
    const binding = await db.discordBinding.findUnique({
      where: { discordUserId: body.discordUserId },
    });

    if (!binding) {
      return errorResponse('绑定记录不存在', 'BINDING_NOT_FOUND', 404);
    }

    await db.discordBinding.delete({
      where: { id: binding.id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleError(error, '解绑 Discord 用户');
  }
});
