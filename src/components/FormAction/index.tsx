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

import { type CenterProps } from '@lobehub/ui';
import { Avatar, Center, Flexbox } from '@lobehub/ui';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import { type ReactNode } from 'react';
import { memo } from 'react';

export const styles = createStaticStyles(({ css }) => ({
  container: css`
    border: 1px solid ${cssVar.colorSplit};
    border-radius: 8px;
    color: ${cssVar.colorText};
    background: ${cssVar.colorBgContainer};
  `,
  desc: css`
    color: ${cssVar.colorTextTertiary};
    text-align: center;
  `,
  form: css`
    width: 100%;
    max-width: 300px;
  `,
}));

const FormAction = memo<
  {
    animation?: boolean;
    avatar: ReactNode;
    background?: string;
    description: ReactNode;
    title: string;
  } & CenterProps
>(
  ({
    children,
    background,
    title,
    description,
    avatar,
    animation,
    className,
    gap = 16,
    ...rest
  }) => {
    return (
      <Center className={cx(styles.form, className)} gap={gap} {...rest}>
        <Avatar
          animation={animation}
          avatar={avatar}
          background={background ?? cssVar.colorFillContent}
          gap={12}
          size={80}
        />
        <Flexbox gap={8} width={'100%'}>
          <Flexbox style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
            {title}
          </Flexbox>
          <Flexbox className={styles.desc}>{description}</Flexbox>
        </Flexbox>
        {children}
      </Center>
    );
  },
);

export default FormAction;
