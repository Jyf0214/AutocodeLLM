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

import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCallerFactory } from '@/libs/trpc/lambda';
import { type AuthContext } from '@/libs/trpc/lambda/context';
import { createContextInner } from '@/libs/trpc/lambda/context';

import { trpc } from '../lambda/init';
import { userAuth } from './userAuth';

const appRouter = trpc.router({
  protectedQuery: trpc.procedure.use(userAuth).query(async ({ ctx }) => {
    return ctx.userId;
  }),
});

const createCaller = createCallerFactory(appRouter);
let ctx: AuthContext;
let router: ReturnType<typeof createCaller>;

beforeEach(async () => {
  vi.resetAllMocks();
});

describe('userAuth middleware', () => {
  it('should throw UNAUTHORIZED error if userId is not present in context', async () => {
    ctx = await createContextInner();
    router = createCaller(ctx);

    try {
      await router.protectedQuery();
    } catch (e) {
      expect(e).toEqual(new TRPCError({ code: 'UNAUTHORIZED' }));
    }
  });

  it('should call next with userId in context if userId is present', async () => {
    ctx = await createContextInner({ userId: 'user-id' });
    router = createCaller(ctx);

    const data = await router.protectedQuery();

    expect(data).toEqual('user-id');
  });
});
