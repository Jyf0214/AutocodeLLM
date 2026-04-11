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

import { type UIChatMessage } from '@lobechat/types';
import { type ActionIconGroupEvent, type ActionIconGroupItemType } from '@lobehub/ui';
import { ActionIconGroup, Flexbox } from '@lobehub/ui';
import { memo, useCallback, useMemo } from 'react';

import { MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES } from '@/const/messageActionPortal';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import {
  type MessageActionItem,
  type MessageActionItemOrDivider,
  type MessageActionsConfig,
} from '../../../types';
import MessageBranch from '../../components/MessageBranch';
import { useUserActions } from './useUserActions';

// Helper to strip handleClick from action items before passing to ActionIconGroup
const stripHandleClick = (item: MessageActionItemOrDivider): ActionIconGroupItemType => {
  if ('type' in item && item.type === 'divider') return item as unknown as ActionIconGroupItemType;
  const { children, ...rest } = item as MessageActionItem;
  const baseItem = { ...rest } as MessageActionItem;
  delete (baseItem as { handleClick?: unknown }).handleClick;
  if (children) {
    return {
      ...baseItem,
      children: children.map((child) => {
        const nextChild = { ...child } as MessageActionItem;
        delete (nextChild as { handleClick?: unknown }).handleClick;
        return nextChild;
      }),
    } as ActionIconGroupItemType;
  }
  return baseItem as ActionIconGroupItemType;
};

// Build action items map for handleAction lookup
const buildActionsMap = (items: MessageActionItemOrDivider[]): Map<string, MessageActionItem> => {
  const map = new Map<string, MessageActionItem>();
  for (const item of items) {
    if ('key' in item && item.key) {
      map.set(String(item.key), item as MessageActionItem);
      // Also index children for submenu items
      if ('children' in item && item.children) {
        for (const child of item.children) {
          if (child.key) {
            map.set(`${item.key}.${child.key}`, child as unknown as MessageActionItem);
          }
        }
      }
    }
  }
  return map;
};

interface UserActionsProps {
  actionsConfig?: MessageActionsConfig;
  data: UIChatMessage;
  disableEditing?: boolean;
  id: string;
}

export const UserActionsBar = memo<UserActionsProps>(({ actionsConfig, id, data }) => {
  // Get default actions from hook
  const defaultActions = useUserActions({ data, id });

  // Create extra actions from factory functions
  const extraBarItems = useMemo(() => {
    if (!actionsConfig?.extraBarActions) return [];
    return actionsConfig.extraBarActions
      .map((factory) => factory(id))
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [actionsConfig?.extraBarActions, id]);

  const extraMenuItems = useMemo(() => {
    if (!actionsConfig?.extraMenuActions) return [];
    return actionsConfig.extraMenuActions
      .map((factory) => factory(id))
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [actionsConfig?.extraMenuActions, id]);

  // Use external config if provided, otherwise use defaults
  // Append extra actions from factories
  const barItems = useMemo(() => {
    const base = actionsConfig?.bar ?? [
      defaultActions.regenerate,
      defaultActions.edit,
      defaultActions.copy,
    ];
    return [...base, ...extraBarItems];
  }, [actionsConfig?.bar, defaultActions.regenerate, defaultActions.edit, extraBarItems]);

  const menuItems = useMemo(() => {
    const base = actionsConfig?.menu ?? [
      defaultActions.edit,
      defaultActions.copy,
      defaultActions.divider,
      defaultActions.tts,
      defaultActions.translate,
      defaultActions.divider,
      defaultActions.regenerate,
      defaultActions.del,
    ];
    return [...base, ...extraMenuItems];
  }, [
    actionsConfig?.menu,
    defaultActions.edit,
    defaultActions.copy,
    defaultActions.divider,
    defaultActions.tts,
    defaultActions.translate,
    defaultActions.regenerate,
    defaultActions.del,
    extraMenuItems,
  ]);

  // Strip handleClick for DOM safety
  const items = useMemo(() => barItems.map(stripHandleClick), [barItems]);
  const menu = useMemo(() => menuItems.map(stripHandleClick), [menuItems]);

  // Build actions map for click handling
  const allActions = useMemo(
    () => buildActionsMap([...barItems, ...menuItems]),
    [barItems, menuItems],
  );

  const handleAction = useCallback(
    (event: ActionIconGroupEvent) => {
      // Handle submenu items (e.g., translate -> zh-CN)
      if (event.keyPath && event.keyPath.length > 1) {
        const parentKey = event.keyPath.at(-1);
        const childKey = event.keyPath[0];
        const parent = allActions.get(parentKey!);
        if (parent && 'children' in parent && parent.children) {
          const child = parent.children.find((c) => c.key === childKey);
          child?.handleClick?.();
          return;
        }
      }

      // Handle regular actions
      const action = allActions.get(event.key);
      action?.handleClick?.();
    },
    [allActions],
  );

  return <ActionIconGroup items={items} menu={menu} onActionClick={handleAction} />;
});

UserActionsBar.displayName = 'UserActionsBar';

interface ActionsProps {
  actionsConfig?: MessageActionsConfig;
  data: UIChatMessage;
  disableEditing?: boolean;
  id: string;
  index: number;
}

const actionBarHolder = (
  <div {...{ [MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES.user]: '' }} style={{ height: '28px' }} />
);
const Actions = memo<ActionsProps>(({ id, data, disableEditing }) => {
  const { branch } = data;
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);

  return (
    <Flexbox horizontal align={'center'}>
      {!disableEditing && (
        <Flexbox align={'flex-start'} role="menubar">
          {actionBarHolder}
        </Flexbox>
      )}
      {isDevMode && branch && (
        <MessageBranch
          activeBranchIndex={branch.activeBranchIndex}
          count={branch.count}
          messageId={id}
        />
      )}
    </Flexbox>
  );
});

Actions.displayName = 'UserActions';

export default Actions;
