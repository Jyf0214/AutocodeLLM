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

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appEnv } from '@/envs/app';

import { type TelemetryContext } from './telemetry';
import { checkTelemetryEnabled } from './telemetry';

const { mockGetUserSettings, mockGetUserPreference, MockUserModel } = vi.hoisted(() => {
  const mockGetUserSettings = vi.fn();
  const mockGetUserPreference = vi.fn();
  const MockUserModel = vi.fn().mockImplementation(() => ({
    getUserPreference: mockGetUserPreference,
    getUserSettings: mockGetUserSettings,
  })) as any;
  return { MockUserModel, mockGetUserPreference, mockGetUserSettings };
});

vi.mock('@/envs/app', () => ({
  appEnv: {
    TELEMETRY_DISABLED: false,
  },
}));

vi.mock('@/database/models/user', () => ({
  UserModel: MockUserModel,
}));

describe('checkTelemetryEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset appEnv mock
    vi.mocked(appEnv).TELEMETRY_DISABLED = false;
    // Default mock returns
    mockGetUserSettings.mockResolvedValue(null);
    mockGetUserPreference.mockResolvedValue(null);
  });

  describe('environment variable priority (highest)', () => {
    it('should return telemetryEnabled: false when TELEMETRY_DISABLED=true', async () => {
      vi.mocked(appEnv).TELEMETRY_DISABLED = true;

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      expect(result).toEqual({ telemetryEnabled: false });
      // Should not call database
      expect(mockGetUserSettings).not.toHaveBeenCalled();
    });

    it('should check database when TELEMETRY_DISABLED is false', async () => {
      await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      expect(mockGetUserSettings).toHaveBeenCalled();
    });

    it('should check database when TELEMETRY_DISABLED is undefined', async () => {
      vi.mocked(appEnv).TELEMETRY_DISABLED = undefined;

      await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      expect(mockGetUserSettings).toHaveBeenCalled();
    });
  });

  describe('user_settings.general.telemetry', () => {
    it('should return telemetryEnabled: true when settings.general.telemetry is true and preference is not set', async () => {
      mockGetUserSettings.mockResolvedValue({
        general: { telemetry: true },
      });
      mockGetUserPreference.mockResolvedValue(null);

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      expect(result).toEqual({ telemetryEnabled: true });
    });

    it('should return telemetryEnabled: false from settings.general', async () => {
      mockGetUserSettings.mockResolvedValue({
        general: { telemetry: false },
      });

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      expect(result).toEqual({ telemetryEnabled: false });
    });

    it('should check preference when settings.general.telemetry is not set', async () => {
      mockGetUserSettings.mockResolvedValue({
        general: { fontSize: 14 }, // no telemetry field
      });
      mockGetUserPreference.mockResolvedValue({ telemetry: true });

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      // Should fall back to preference.telemetry
      expect(result).toEqual({ telemetryEnabled: true });
      expect(mockGetUserPreference).toHaveBeenCalled();
    });
  });

  describe('users.preference.telemetry (deprecated, fallback)', () => {
    it('should return telemetryEnabled: true from preference.telemetry', async () => {
      mockGetUserSettings.mockResolvedValue(null);
      mockGetUserPreference.mockResolvedValue({ telemetry: true });

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      expect(result).toEqual({ telemetryEnabled: true });
    });

    it('should return telemetryEnabled: false from preference.telemetry', async () => {
      mockGetUserSettings.mockResolvedValue(null);
      mockGetUserPreference.mockResolvedValue({ telemetry: false });

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      expect(result).toEqual({ telemetryEnabled: false });
    });

    it('should use preference.telemetry when settings.general.telemetry is not false', async () => {
      mockGetUserSettings.mockResolvedValue({
        general: { telemetry: true },
      });
      mockGetUserPreference.mockResolvedValue({ telemetry: false });

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      // preference.telemetry is checked when settings.general.telemetry is not false
      expect(result).toEqual({ telemetryEnabled: false });
      expect(mockGetUserPreference).toHaveBeenCalled();
    });

    it('should not call getUserPreference when settings.general.telemetry is explicitly false', async () => {
      mockGetUserSettings.mockResolvedValue({
        general: { telemetry: false },
      });
      mockGetUserPreference.mockResolvedValue({ telemetry: true });

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      expect(result).toEqual({ telemetryEnabled: false });
      expect(mockGetUserPreference).not.toHaveBeenCalled();
    });
  });

  describe('default value', () => {
    it('should default to true when settings is null', async () => {
      mockGetUserSettings.mockResolvedValue(null);

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      // Default to true (enabled) unless explicitly disabled
      expect(result).toEqual({ telemetryEnabled: true });
    });

    it('should default to true when general is null', async () => {
      mockGetUserSettings.mockResolvedValue({
        general: null,
      });

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      // Default to true (enabled) unless explicitly disabled
      expect(result).toEqual({ telemetryEnabled: true });
    });
  });

  describe('missing context', () => {
    it('should return telemetryEnabled: false when userId is missing', async () => {
      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: null,
      });

      expect(result).toEqual({ telemetryEnabled: false });
      expect(mockGetUserSettings).not.toHaveBeenCalled();
    });

    it('should return telemetryEnabled: false when serverDB is missing', async () => {
      const result = await checkTelemetryEnabled({
        serverDB: undefined,
        userId: 'test-user',
      });

      expect(result).toEqual({ telemetryEnabled: false });
      expect(mockGetUserSettings).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return telemetryEnabled: false when getUserSettings fails', async () => {
      mockGetUserSettings.mockRejectedValue(new Error('Database error'));

      const result = await checkTelemetryEnabled({
        serverDB: {} as TelemetryContext['serverDB'],
        userId: 'test-user',
      });

      expect(result).toEqual({ telemetryEnabled: false });
    });
  });
});
