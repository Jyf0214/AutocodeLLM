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

// EntryComponent.test.tsx
import { render } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';

import EntryComponent, { message, modal, notification } from './index';

// 模拟 App.useApp 方法返回的对象
const mockUseApp = {
  message: { success: vi.fn() },
  modal: { confirm: vi.fn() },
  notification: { open: vi.fn() },
};

vi.mock('antd', () => ({
  App: {
    useApp: vi.fn(() => mockUseApp),
  },
}));

describe('EntryComponent', () => {
  it('should correctly initialize message, modal, and notification', () => {
    render(<EntryComponent />);

    // 验证 App.useApp 是否被调用
    expect(App.useApp).toHaveBeenCalled();

    // 验证 message, modal, 和 notification 是否被正确赋值
    expect(message).toBeDefined();
    expect(modal).toBeDefined();
    expect(notification).toBeDefined();

    // 验证是否赋值的对象与模拟的对象匹配
    expect(message).toEqual(mockUseApp.message);
    expect(modal).toEqual(mockUseApp.modal);
    expect(notification).toEqual(mockUseApp.notification);
  });

  it('should render without crashing', () => {
    const { container } = render(<EntryComponent />);
    expect(container).toBeDefined();
  });
});
