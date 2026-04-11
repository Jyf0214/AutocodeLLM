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

import { type NextRequest } from 'next/server';

/**
 * Prepare Request object for tRPC fetchRequestHandler
 *
 * This function solves the "Response body object should not be disturbed or locked" error
 * that occurs in Next.js 16 when the request body stream has been consumed or locked
 * by Next.js internal mechanisms.
 *
 * By cloning the Request object, we create an independent body stream that tRPC can safely read.
 *
 * @see https://github.com/vercel/next.js/issues/83453
 * @param req - The original NextRequest object
 * @returns A cloned Request object with an independent body stream
 */
export function prepareRequestForTRPC(req: NextRequest): Request {
  // Clone the Request to create an independent body stream
  // This ensures tRPC can read the body even if the original request's body was disturbed
  return req.clone();
}
