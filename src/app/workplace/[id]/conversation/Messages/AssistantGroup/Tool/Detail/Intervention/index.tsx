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

import { UserInteractionIdentifier } from '@lobechat/builtin-tool-user-interaction';
import { getBuiltinIntervention } from '@lobechat/builtin-tools/interventions';
import { safeParseJSON } from '@lobechat/utils';
import { Flexbox } from '@lobehub/ui';
import { memo, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useUserStore } from '@/store/user';
import { toolInterventionSelectors } from '@/store/user/selectors';

import { useConversationStore } from '../../../../../store';
import Arguments from '../Arguments';
import ApprovalActions from './ApprovalActions';
import Fallback from './Fallback';
import KeyValueEditor from './KeyValueEditor';
import SecurityBlacklistWarning from './SecurityBlacklistWarning';

export type { ApprovalMode } from '@/store/user/slices/settings/selectors';

interface InterventionProps {
  actionsPortalTarget?: HTMLDivElement | null;
  apiName: string;
  assistantGroupId?: string;
  id: string;
  identifier: string;
  requestArgs: string;
  toolCallId: string;
}

const Intervention = memo<InterventionProps>(
  ({ requestArgs, id, identifier, apiName, toolCallId, assistantGroupId, actionsPortalTarget }) => {
    const approvalMode = useUserStore(toolInterventionSelectors.approvalMode);
    const [isEditing, setIsEditing] = useState(false);
    const updatePluginArguments = useConversationStore((s) => s.updatePluginArguments);

    // Store beforeApprove callbacks from intervention components (support multiple registrations)
    // Use Map with id as key for reliable cleanup
    const beforeApproveCallbacksRef = useRef<Map<string, () => void | Promise<void>>>(new Map());

    // Register a callback to be called before approval
    const registerBeforeApprove = useCallback(
      (callbackId: string, callback: () => void | Promise<void>) => {
        beforeApproveCallbacksRef.current.set(callbackId, callback);
        // Return cleanup function to unregister
        return () => {
          beforeApproveCallbacksRef.current.delete(callbackId);
        };
      },
      [],
    );

    // Handler to be called before approve action - calls all registered callbacks
    const handleBeforeApprove = useCallback(async () => {
      const callbacks = Array.from(beforeApproveCallbacksRef.current.values());
      await Promise.all(callbacks.map((cb) => cb()));
    }, []);

    const handleCancel = useCallback(() => {
      setIsEditing(false);
    }, []);

    const handleFinish = useCallback(
      async (editedObject: Record<string, any>) => {
        if (!toolCallId) return;

        try {
          const newArgsString = JSON.stringify(editedObject, null, 2);

          if (newArgsString !== requestArgs) {
            await updatePluginArguments(toolCallId, editedObject, true);
          }
          setIsEditing(false);
        } catch (error) {
          console.error('Error stringifying arguments:', error);
        }
      },
      [requestArgs, toolCallId, updatePluginArguments],
    );

    // Callback for builtin intervention components to update arguments
    const handleArgsChange = useCallback(
      async (newArgs: unknown) => {
        if (!toolCallId) return;
        await updatePluginArguments(toolCallId, newArgs, true);
      },
      [toolCallId, updatePluginArguments],
    );

    const parsedArgs = useMemo(() => safeParseJSON(requestArgs || '') ?? {}, [requestArgs]);

    const isCustomInteraction = identifier === UserInteractionIdentifier;

    const submitToolInteraction = useConversationStore((s) => s.submitToolInteraction);
    const skipToolInteraction = useConversationStore((s) => s.skipToolInteraction);
    const cancelToolInteraction = useConversationStore((s) => s.cancelToolInteraction);

    const handleInteractionAction = useCallback(
      async (
        action:
          | { type: 'submit'; payload: Record<string, unknown> }
          | { type: 'skip'; reason?: string }
          | { type: 'cancel' },
      ) => {
        switch (action.type) {
          case 'submit': {
            await submitToolInteraction(id, action.payload);
            break;
          }
          case 'skip': {
            await skipToolInteraction(id, action.reason);
            break;
          }
          case 'cancel': {
            await cancelToolInteraction(id);
            break;
          }
        }
      },
      [id, submitToolInteraction, skipToolInteraction, cancelToolInteraction],
    );

    const BuiltinToolInterventionRender = getBuiltinIntervention(identifier, apiName);

    if (BuiltinToolInterventionRender) {
      if (isEditing)
        return (
          <Suspense fallback={<Arguments arguments={requestArgs} />}>
            <KeyValueEditor
              initialValue={parsedArgs}
              onCancel={handleCancel}
              onFinish={handleFinish}
            />
          </Suspense>
        );

      if (isCustomInteraction) {
        return (
          <Flexbox gap={12}>
            <BuiltinToolInterventionRender
              apiName={apiName}
              args={parsedArgs}
              identifier={identifier}
              interactionMode="custom"
              messageId={id}
              registerBeforeApprove={registerBeforeApprove}
              onArgsChange={handleArgsChange}
              onInteractionAction={handleInteractionAction}
            />
          </Flexbox>
        );
      }

      const actions = (
        <Flexbox horizontal justify={'flex-end'}>
          <ApprovalActions
            apiName={apiName}
            approvalMode={approvalMode}
            assistantGroupId={assistantGroupId}
            identifier={identifier}
            messageId={id}
            toolCallId={toolCallId}
            onBeforeApprove={handleBeforeApprove}
          />
        </Flexbox>
      );

      return (
        <Flexbox gap={12}>
          <SecurityBlacklistWarning args={parsedArgs} />
          <BuiltinToolInterventionRender
            apiName={apiName}
            args={parsedArgs}
            identifier={identifier}
            messageId={id}
            registerBeforeApprove={registerBeforeApprove}
            onArgsChange={handleArgsChange}
          />
          {actionsPortalTarget ? createPortal(actions, actionsPortalTarget) : actions}
        </Flexbox>
      );
    }

    return (
      <Flexbox gap={12}>
        <SecurityBlacklistWarning args={parsedArgs} />
        <Fallback
          actionsPortalTarget={actionsPortalTarget}
          apiName={apiName}
          assistantGroupId={assistantGroupId}
          id={id}
          identifier={identifier}
          requestArgs={requestArgs}
          toolCallId={toolCallId}
        />
      </Flexbox>
    );
  },
);

export default Intervention;
