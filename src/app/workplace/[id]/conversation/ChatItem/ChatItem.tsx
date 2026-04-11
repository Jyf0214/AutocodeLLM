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

import { Flexbox } from '@lobehub/ui';
import { cx } from 'antd-style';
import { memo } from 'react';

import Actions from './components/Actions';
import Avatar from './components/Avatar';
import ErrorContent from './components/ErrorContent';
import MessageContent from './components/MessageContent';
import Title from './components/Title';
import { styles } from './style';
import { type ChatItemProps } from './type';

const ChatItem = memo<ChatItemProps>(
  ({
    onAvatarClick,
    avatarProps,
    customAvatarRender,
    actions,
    className,
    loading,
    message,
    placeholderMessage = '...',
    placement = 'left',
    avatar,
    error,
    showTitle,
    time,
    editing,
    messageExtra,
    children,
    customErrorRender,
    onDoubleClick,
    aboveMessage,
    belowMessage,
    showAvatar = true,
    titleAddon,
    disabled = false,
    id,
    style,
    ...rest
  }) => {
    const isUser = placement === 'right';
    const isEmptyMessage =
      !message || String(message).trim() === '' || message === placeholderMessage;
    const errorContent = error && (
      <ErrorContent customErrorRender={customErrorRender} error={error} id={id} />
    );

    const avatarContent = (
      <Avatar
        alt={avatarProps?.alt || avatar.title || 'avatar'}
        loading={loading}
        shape={'square'}
        onClick={onAvatarClick}
        {...avatarProps}
        avatar={avatar}
      />
    );

    return (
      <Flexbox
        align={isUser ? 'flex-end' : 'flex-start'}
        className={cx('message-wrapper', styles.container, className)}
        data-message-id={id}
        gap={8}
        paddingBlock={8}
        style={{
          paddingInlineStart: isUser ? 36 : 0,
          ...style,
        }}
        {...rest}
      >
        <Flexbox
          align={'center'}
          className={'message-header'}
          direction={isUser ? 'horizontal-reverse' : 'horizontal'}
          gap={8}
        >
          {showAvatar &&
            (customAvatarRender ? customAvatarRender(avatar, avatarContent) : avatarContent)}
          <Title avatar={avatar} showTitle={showTitle} time={time} titleAddon={titleAddon} />
        </Flexbox>
        <Flexbox
          className={'message-body'}
          gap={8}
          style={{
            maxWidth: '100%',
            overflow: 'hidden',
            position: 'relative',
            width: isUser ? undefined : '100%',
          }}
        >
          {aboveMessage}
          {error && isEmptyMessage ? (
            errorContent
          ) : (
            <MessageContent
              disabled={disabled}
              editing={editing}
              id={id!}
              message={message}
              variant={isUser ? 'bubble' : undefined}
              messageExtra={
                <>
                  {errorContent}
                  {messageExtra}
                </>
              }
              onDoubleClick={onDoubleClick}
            >
              {children}
            </MessageContent>
          )}
          {belowMessage}
        </Flexbox>
        {actions && <Actions actions={actions} placement={placement} />}
      </Flexbox>
    );
  },
);

export default ChatItem;
