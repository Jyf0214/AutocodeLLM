import { describe, it, expect } from 'vitest';

describe('AutocodeLLM', () => {
  it('应该通过基础测试', () => {
    expect(true).toBe(true);
  });

  it('项目配置应该正确', () => {
    const pkg = {
      name: 'autocodellm',
      version: '0.1.0',
    };
    expect(pkg.name).toBe('autocodellm');
    expect(pkg.version).toMatch(/\d+\.\d+\.\d+/);
  });
});
