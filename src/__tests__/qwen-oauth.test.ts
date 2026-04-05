/**
 * Qwen OAuth 模块测试
 * 测试 Device Flow 启动、Token 轮询和刷新功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startQwenDeviceFlow,
  pollQwenToken,
  refreshQwenToken,
  isTokenExpiring,
  type DeviceCodeResponse,
  type TokenResponse,
} from '@/lib/auth/qwen/oauth';

describe('Qwen OAuth 模块', () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('startQwenDeviceFlow', () => {
    it('应该成功启动 Device Flow 并返回登录链接', async () => {
      const mockResponse: DeviceCodeResponse = {
        device_code: 'test_device_code',
        user_code: 'ABCD1234',
        verification_uri: 'https://chat.qwen.ai/oauth/authorize',
        verification_uri_complete:
          'https://chat.qwen.ai/oauth/authorize?user_code=ABCD1234',
        expires_in: 900,
        interval: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await startQwenDeviceFlow();

      expect(result).toEqual({
        deviceCode: 'test_device_code',
        userCode: 'ABCD1234',
        verificationUri: 'https://chat.qwen.ai/oauth/authorize',
        verificationUriComplete:
          'https://chat.qwen.ai/oauth/authorize?user_code=ABCD1234',
        expiresIn: 900,
        interval: 2,
        codeVerifier: expect.any(String),
      });

      // 验证请求参数
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://chat.qwen.ai/api/v1/oauth2/device/code');
      expect(options.method).toBe('POST');
      expect(options.headers).toHaveProperty('Content-Type', 'application/x-www-form-urlencoded');
      expect(options.headers).toHaveProperty('Accept', 'application/json');
      expect(options.headers).toHaveProperty('x-request-id');
      expect(options.body).toContain('client_id=');
      expect(options.body).toContain('code_challenge=');
      expect(options.body).toContain('code_challenge_method=S256');
    });

    it('应该在 API 失败时抛出错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: 'invalid_request',
              error_description: '请求参数无效',
            })
          ),
      });

      await expect(startQwenDeviceFlow()).rejects.toThrow('启动 Device Flow 失败');
    });

    it('应该包含 x-request-id header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            device_code: 'test',
            user_code: 'TEST',
            verification_uri: 'https://test.com',
            verification_uri_complete: 'https://test.com?code=TEST',
            expires_in: 900,
          }),
      });

      await startQwenDeviceFlow();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['x-request-id']).toBeDefined();
      expect(typeof options.headers['x-request-id']).toBe('string');
      // UUID 格式检查
      expect(options.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('pollQwenToken', () => {
    const mockDeviceCode = 'test_device_code';
    const mockCodeVerifier = 'test_code_verifier';

    it('应该成功获取 Token', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_type: 'Bearer',
        expires_in: 3600,
        resource_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await pollQwenToken(mockDeviceCode, mockCodeVerifier);

      expect(result).toEqual({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        resourceUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
    });

    it('应该在用户未授权时抛出 AUTHORIZATION_PENDING', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: 'authorization_pending',
            error_description: '用户尚未授权',
          }),
      });

      await expect(
        pollQwenToken(mockDeviceCode, mockCodeVerifier)
      ).rejects.toThrow('AUTHORIZATION_PENDING');
    });

    it('应该在请求过频时抛出 SLOW_DOWN', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            error: 'slow_down',
            error_description: '请求过于频繁',
          }),
      });

      await expect(
        pollQwenToken(mockDeviceCode, mockCodeVerifier)
      ).rejects.toThrow('SLOW_DOWN');
    });

    it('应该在 Device Code 过期时抛出 DEVICE_CODE_EXPIRED', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: 'expired_token',
            error_description: 'Device Code 已过期',
          }),
      });

      await expect(
        pollQwenToken(mockDeviceCode, mockCodeVerifier)
      ).rejects.toThrow('DEVICE_CODE_EXPIRED');
    });
  });

  describe('refreshQwenToken', () => {
    it('应该成功刷新 Token', async () => {
      const mockRefreshResponse: TokenResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse),
      });

      const result = await refreshQwenToken('old_refresh_token');

      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 3600,
      });
    });

    it('应该在 refresh token 无效时抛出错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: 'invalid_grant',
            error_description: '刷新令牌无效或已过期',
          }),
      });

      await expect(refreshQwenToken('invalid_token')).rejects.toThrow(
        '刷新 Token 已过期或无效'
      );
    });
  });

  describe('isTokenExpiring', () => {
    it('应该在 Token 即将过期时返回 true', () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 120 * 1000); // 2 分钟后过期

      expect(isTokenExpiring(expiresAt, 300)).toBe(true);
    });

    it('应该在 Token 未即将过期时返回 false', () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 600 * 1000); // 10 分钟后过期

      expect(isTokenExpiring(expiresAt, 300)).toBe(false);
    });

    it('应该使用默认的 300 秒缓冲时间', () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 301 * 1000);

      expect(isTokenExpiring(expiresAt)).toBe(false);
    });
  });
});
