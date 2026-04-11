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

/**
 * @vitest-environment happy-dom
 */
import { render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MultipleProvidersModelItem } from '../MultipleProvidersModelItem';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@lobehub/ui', () => ({
  DropdownMenuGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  DropdownMenuItemIcon: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  DropdownMenuItemLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  DropdownMenuPopup: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DropdownMenuPortal: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuPositioner: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSubmenuRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSubmenuTrigger: ({
    children,
    className,
    onClick,
    style,
  }: HTMLAttributes<HTMLDivElement>) => (
    <div className={className} style={style} onClick={onClick}>
      {children}
    </div>
  ),
  Flexbox: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  Tag: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  menuSharedStyles: { item: 'item' },
}));

vi.mock('@/components/ModelSelect', () => ({
  ModelItemRender: ({ displayName }: { displayName: string }) => <div>{displayName}</div>,
  ProviderItemRender: ({ name }: { name: string }) => <div>{name}</div>,
}));

vi.mock('../../ModelDetailPanel', () => ({
  default: ({ model, provider }: { model: string; provider: string }) => (
    <div data-testid="model-detail-panel">
      {provider}/{model}
    </div>
  ),
}));

describe('MultipleProvidersModelItem', () => {
  it('renders model detail panel even when info tags are hidden', () => {
    render(
      <MultipleProvidersModelItem
        activeKey="lobehub/gpt-5.4"
        newLabel="new"
        showInfoTag={false}
        data={{
          displayName: 'GPT-5.4',
          model: {
            abilities: {},
            displayName: 'GPT-5.4',
            id: 'gpt-5.4',
          } as any,
          providers: [
            { id: 'lobehub', name: 'LobeHub' },
            { id: 'openai', name: 'OpenAI' },
          ],
        }}
        onClose={vi.fn()}
        onModelChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('model-detail-panel')).toHaveTextContent('lobehub/gpt-5.4');
    expect(screen.getByText('ModelSwitchPanel.useModelFrom')).toBeInTheDocument();
  });
});
