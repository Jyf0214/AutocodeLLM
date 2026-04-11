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

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MCPClient } from '../index';

const require = createRequire(import.meta.url);
const mcpHelloWorldRoot = dirname(require.resolve('mcp-hello-world/package.json'));
/** Local stdio entry (see mcp-hello-world `bin`); avoids `npx` so npm never reads this repo's overrides. */
const mcpHelloWorldStdio = join(mcpHelloWorldRoot, 'build', 'stdio.js');

describe('MCPClient', () => {
  // --- Updated Stdio Transport tests ---
  describe('Stdio Transport', () => {
    let mcpClient: MCPClient;
    const TIMEOUT = 120_000;
    const stdioConnection = {
      id: 'mcp-hello-world',
      name: 'Stdio SDK Test Connection',
      type: 'stdio' as const,
      command: process.execPath,
      args: [mcpHelloWorldStdio],
    };

    beforeEach(async () => {
      // args are now set directly in the connection object
      mcpClient = new MCPClient(stdioConnection);
      // Initialize the client - this starts the stdio process
      await mcpClient.initialize();
      // Add a small delay to allow the server process to fully start (optional, but can help)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }, TIMEOUT);

    afterEach(async () => {
      // Assume SDK client/transport handles process termination gracefully
      // If processes leak, more explicit cleanup might be needed here
    }, TIMEOUT);

    it(
      'should create and initialize an instance with stdio transport',
      () => {
        expect(mcpClient).toBeInstanceOf(MCPClient);
      },
      TIMEOUT,
    );

    it(
      'should list tools via stdio',
      async () => {
        const result = await mcpClient.listTools();

        // Check exact length if no other tools are expected
        expect(result).toHaveLength(3);

        // Expect the tools defined in mock-sdk-server.ts
        expect(result).toMatchSnapshot();
      },
      TIMEOUT,
    );

    it(
      'should call the "echo" tool via stdio',
      async () => {
        const toolName = 'echo';
        const toolArgs = { message: 'hello stdio' };
        // Expect the result format defined in mock-sdk-server.ts
        const expectedResult = {
          content: [{ type: 'text', text: 'You said: hello stdio' }],
        };

        const result = await mcpClient.callTool(toolName, toolArgs);
        expect(result).toEqual(expectedResult);
      },
      TIMEOUT,
    );

    it(
      'should call the "add" tool via stdio',
      async () => {
        const toolName = 'add';
        const toolArgs = { a: 5, b: 7 };

        const result = await mcpClient.callTool(toolName, toolArgs);
        expect(result).toEqual({
          content: [{ type: 'text', text: 'The sum is: 12' }],
        });
      },
      TIMEOUT,
    );
  });

  // Error Handling tests remain the same...
  describe('Error Handling', () => {
    it('should throw error for unsupported connection type', () => {
      const connection = {
        id: 'invalid-test',
        name: 'Invalid Test Connection',
        type: 'invalid' as any,
      };
      expect(() => new MCPClient(connection as any)).toThrow(
        'Unsupported MCP connection type: invalid',
      );
    });
  });
});
