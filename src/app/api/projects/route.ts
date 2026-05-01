/**
 * 项目列表和创建项目 API
 * GET /api/projects - 获取所有项目列表
 * POST /api/projects - 创建项目
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/log';
import {
  successResponse,
  handleError,
  validateRequiredFields,
  type ApiResponse,
} from '@/lib/api/response';
import type { ProjectResponse, CreateProjectRequest } from '@/lib/api/project-types';

/**
 * GET /api/projects - 获取所有项目列表
 */
export async function GET(): Promise<NextResponse<ProjectResponse>> {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    logger.info(`获取项目列表: ${projects.length} 个`);

    const data = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      accessPassword: project.accessPassword ? '***' : null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));

    return successResponse(data);
  } catch (error) {
    return handleError(error, '获取项目列表');
  }
}

/**
 * POST /api/projects - 创建项目
 */
export async function POST(
  request: Request,
): Promise<NextResponse<ProjectResponse>> {
  try {
    const body = (await request.json()) as CreateProjectRequest;

    // 验证必填字段
    const validationError = validateRequiredFields({ name: body.name });
    if (validationError) {
      return validationError as NextResponse<ApiResponse<never>> as NextResponse<ProjectResponse>;
    }

    const { name, description } = body;

    const newProject = await prisma.project.create({
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
}
