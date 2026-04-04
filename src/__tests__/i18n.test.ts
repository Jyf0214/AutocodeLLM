import { describe, it, expect } from 'vitest';
import zhMessages from '@/i18n/messages/zh/common.json';
import enMessages from '@/i18n/messages/en/common.json';

describe('国际化翻译文件', () => {
  describe('中文翻译', () => {
    it('应该包含 common 命名空间', () => {
      expect(zhMessages.common.appName).toBe('AutocodeLLM');
      expect(zhMessages.common.login).toBe('登录');
      expect(zhMessages.common.workplace).toBe('工作空间');
      expect(zhMessages.common.agents).toBe('任务代理');
    });

    it('登录页面应该有所有必要的翻译', () => {
      expect(zhMessages.login.title).toBeDefined();
      expect(zhMessages.login.subtitle).toBeDefined();
      expect(zhMessages.login.username).toBeDefined();
      expect(zhMessages.login.password).toBeDefined();
      expect(zhMessages.login.submit).toBeDefined();
    });

    it('Demo 页面应该有场景翻译', () => {
      expect(zhMessages.demo.scenarios.office).toBeDefined();
      expect(zhMessages.demo.scenarios.coding).toBeDefined();
      expect(zhMessages.demo.scenarios.analysis).toBeDefined();
    });
  });

  describe('英文翻译', () => {
    it('应该包含 common 命名空间', () => {
      expect(enMessages.common.appName).toBe('AutocodeLLM');
      expect(enMessages.common.login).toBe('Login');
      expect(enMessages.common.workplace).toBe('Workspace');
      expect(enMessages.common.agents).toBe('Task Agents');
    });

    it('登录页面应该有所有必要的翻译', () => {
      expect(enMessages.login.title).toBeDefined();
      expect(enMessages.login.subtitle).toBeDefined();
      expect(enMessages.login.username).toBeDefined();
      expect(enMessages.login.password).toBeDefined();
      expect(enMessages.login.submit).toBeDefined();
    });
  });

  describe('翻译一致性', () => {
    const getNestedKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
      const keys: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          keys.push(...getNestedKeys(value as Record<string, unknown>, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys.sort();
    };

    it('中英文翻译键应该一致', () => {
      const zhKeys = getNestedKeys(zhMessages);
      const enKeys = getNestedKeys(enMessages);

      expect(zhKeys).toEqual(enKeys);
    });
  });
});
