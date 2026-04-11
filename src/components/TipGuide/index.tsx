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

import { ActionIcon, Flexbox, Popover } from '@lobehub/ui';
import { type TooltipProps } from 'antd';
import { ConfigProvider } from 'antd';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import { XIcon } from 'lucide-react';
import { type CSSProperties, type FC, type ReactNode } from 'react';

const styles = createStaticStyles(({ css }) => {
  return {
    close: css`
      color: white;
    `,
    container: css`
      position: relative;
    `,
    footer: css`
      display: flex;
      justify-content: end;
      width: 100%;
    `,
    overlay: css`
      .ant-popover-inner {
        border: none;
      }
    `,
    tip: css`
      position: absolute;
      inset-inline-start: 50%;
      transform: translate(-50%);
    `,
  };
});

export interface TipGuideProps {
  /**
   * Guide content
   */
  children?: ReactNode;
  /**
   * Class name
   */
  className?: string;
  /**
   * Default open state
   */
  defaultOpen?: boolean;
  /**
   * Render function for customizing the footer section
   */
  footerRender?: (dom: ReactNode) => ReactNode;
  /**
   * Maximum width
   */
  maxWidth?: number;
  /**
   * Vertical offset value
   */
  offsetY?: number;
  /**
   * Callback triggered when the open property changes
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Controlled open property
   */
  open?: boolean;
  /**
   * Tooltip placement, defaults to bottom
   */
  placement?: TooltipProps['placement'];
  /**
   * style
   */
  style?: CSSProperties;
  tip?: boolean;
  /**
   * Guide title
   */
  title: string;
}

const TipGuide: FC<TipGuideProps> = ({
  children,
  placement = 'bottom',
  title,
  offsetY,
  maxWidth = 300,
  className,
  style,
  open,
  onOpenChange: setOpen,
}) => {
  return (
    <ConfigProvider
      theme={{
        components: {
          Badge: { fontSize: 12, lineHeight: 1 },
          Button: { colorPrimary: cssVar.blue7 },
          Checkbox: {
            colorPrimary: cssVar.blue7,
            colorText: cssVar.colorTextLightSolid,
          },
          Popover: { colorText: cssVar.colorTextLightSolid },
        },
      }}
    >
      {open ? (
        <div className={styles.container}>
          <div
            style={{
              marginTop: offsetY,
            }}
          >
            <Popover
              arrow={true}
              open={open}
              placement={placement}
              trigger="hover"
              classNames={{
                root: cx(className, styles.overlay),
              }}
              content={
                <Flexbox horizontal gap={24} style={{ userSelect: 'none' }}>
                  <div>{title}</div>
                  <ActionIcon
                    className={styles.close}
                    icon={XIcon}
                    size={'small'}
                    onClick={() => {
                      setOpen(false);
                    }}
                  />
                </Flexbox>
              }
              styles={{
                root: { maxWidth, zIndex: 1000, ...style },
              }}
            >
              {children}
            </Popover>
          </div>
        </div>
      ) : (
        children
      )}
    </ConfigProvider>
  );
};

export default TipGuide;
