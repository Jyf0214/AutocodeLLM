/**
 * 项目列表和创建项目 API
 * GET /api/projects - 获取所有项目列表
 * POST /api/projects - 创建项目
 */

import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import {
  successResponse,
  handleError,
  validateRequiredFields,
} from '@/lib/api/response';
import type { ProjectResponse, CreateProjectRequest } from '@/lib/api/project-types';
import { getPrisma } from '@/lib/db/get-prisma';


/**
 * GET /api/projects - 获取所有项目列表
 */
export const GET = withApiLogging('GET /api/projects', async function GET(
  _request: Request,
): Promise<NextResponse<ProjectResponse>> {
  try {
    const db = await getPrisma();
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const data = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      accessPassword: project.accessPassword ? '***' : null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));

    return successResponse(data, 200, {
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
    });
  } catch (error) {
    return handleError(error, '获取项目列表');
  }
});

/**
 * POST /api/projects - 创建项目
 */
export const POST = withApiLogging('POST /api/projects', async function POST(
  request: Request,
): Promise<NextResponse<ProjectResponse>> {
  try {
    const body = (await request.json()) as CreateProjectRequest;

    const validationError = validateRequiredFields({ name: body.name });
    if (validationError) {
      return validationError;
    }

    const { name, description } = body;

    const db = await getPrisma();
    const newProject = await db.project.create({
      data: {
        name,
        description: description ?? '',
      },
    });

    return successResponse(
      {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description,
        accessPassword: newProject.accessPassword ? '***' : null,
        createdAt: newProject.createdAt.toISOString(),
        updatedAt: newProject.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleError(error, '创建项目');
  }
});
