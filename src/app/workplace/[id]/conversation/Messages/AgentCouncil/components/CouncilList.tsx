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

'use client';

import { type UIChatMessage } from '@lobechat/types';
import { Flexbox } from '@lobehub/ui';
import { Divider } from 'antd';
import isEqual from 'fast-deep-equal';
import { Fragment, memo } from 'react';

import { CONVERSATION_MIN_WIDTH } from '@/const/layoutTokens';
import WideScreenContainer from '@/features/WideScreenContainer';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import CouncilMember from './CouncilMember';
import ScrollShadowWithButton from './ScrollShadowWithButton';

export type DisplayMode = 'horizontal' | 'tab';

interface CouncilListProps {
  activeTab: number;
  displayMode?: DisplayMode;
  members?: UIChatMessage[];
}

const CouncilList = memo<CouncilListProps>(({ members, displayMode, activeTab }) => {
  const wideScreen = useGlobalStore(systemStatusSelectors.wideScreen);
  if (!members || members.length === 0) {
    return null;
  }

  switch (displayMode) {
    case 'tab': {
      const activeMember = members[activeTab];
      if (!activeMember) return null;

      return (
        <WideScreenContainer>
          <CouncilMember index={activeTab} item={activeMember} />
        </WideScreenContainer>
      );
    }

    default: {
      if (members.length < 2) {
        return (
          <WideScreenContainer gap={16}>
            {members.map((member, idx) => {
              if (!member) return null;
              return <CouncilMember index={idx} item={member} key={member.id} />;
            })}
          </WideScreenContainer>
        );
      }
      const MIN_WIDTH = CONVERSATION_MIN_WIDTH / 2;
      return (
        <ScrollShadowWithButton justify={wideScreen ? 'flex-start' : 'center'}>
          <Flexbox
            horizontal
            justify={wideScreen ? 'flex-start' : 'center'}
            paddingInline={16}
            style={{
              minWidth: MIN_WIDTH * members.length + 32 + 32 * (members.length - 1),
            }}
          >
            {members?.map((member, idx) => {
              if (!member) return null;
              return (
                <Fragment key={member.id}>
                  <Flexbox
                    gap={12}
                    key={member.id}
                    width={`min(${MIN_WIDTH}px, 100%)`}
                    style={{
                      minWidth: MIN_WIDTH,
                      position: 'relative',
                    }}
                  >
                    <CouncilMember index={idx} item={member} />
                  </Flexbox>
                  {idx < members?.length - 1 && (
                    <Divider
                      dashed
                      orientation={'vertical'}
                      style={{ height: 'unset', marginInline: 16 }}
                    />
                  )}
                </Fragment>
              );
            })}
          </Flexbox>
        </ScrollShadowWithButton>
      );
    }
  }
}, isEqual);

export default CouncilList;
