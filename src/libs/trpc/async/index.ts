/**
 * 本代码来源于 LobeChat 项目（https://github.com/lobehub/lobe-chat）
 *
 * LobeChat 许可证信息：
 * LobeHub Community License（基于 Apache License 2.0）
 * Copyright (c) 2024-2026 LobeHub LLC. All rights reserved.
 * 详细信息：http://www.apache.org/licenses/LICENSE-2.0
 *
 * 修改声明：
 * 本文件已从 LobeChat 源代码进行修改以适配 AutocodeLLM 项目。
 * 修改内容包括：目录结构调整、依赖适配、API 接口兼容等。
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 *
 * 双重许可：本文件同时受上述两个许可证约束。
 * 商业使用需分别获得对应授权。
 */

import debug from 'debug';

import { getServerDB } from '@/database/core/db-adaptor';

import { asyncAuth } from './asyncAuth';
import { asyncTrpc } from './init';

const log = debug('lobe-async:middleware');

export const publicProcedure = asyncTrpc.procedure;

export const asyncRouter = asyncTrpc.router;

const dbMiddleware = asyncTrpc.middleware(async (opts) => {
  log('Database middleware called');

  try {
    log('Getting server database connection');
    const serverDB = await getServerDB();
    log('Database connection established successfully');

    return opts.next({
      ctx: { serverDB },
    });
  } catch (error) {
    log('Failed to establish database connection: %O', error);
    throw error;
  }
});

export const asyncAuthedProcedure = asyncTrpc.procedure.use(dbMiddleware).use(asyncAuth);

export const createAsyncCallerFactory = asyncTrpc.createCallerFactory;
