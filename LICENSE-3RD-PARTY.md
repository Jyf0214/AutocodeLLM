# 第三方组件许可证声明

本项目 (AutocodeLLM) 使用以下第三方开源组件,各组件的许可证信息如下:

## 核心依赖

| 组件 | 版本 | 许可证 | 说明 |
|------|------|--------|------|
| next | 16.2.2 | MIT | React 框架 |
| react | 19 | MIT | UI 库 |
| react-dom | 19 | MIT | React DOM |
| antd | 6.3.5 | MIT | UI 组件库 |
| @ant-design/icons | 6.1.1 | MIT | 图标库 |
| @lobehub/ui | 5.6.4 | MIT | UI 框架 |
| @lobehub/icons | 5.2.0 | MIT | AI 图标库 |
| @prisma/client | 6.19.3 | Apache-2.0 | 数据库客户端 |
| openai | 6.33.0 | Apache-2.0 | OpenAI SDK |
| @anthropic-ai/sdk | 0.82.0 | MIT | Anthropic SDK |

## 图像处理依赖 (Sharp)

以下 sharp 平台特定包使用 **LGPL-3.0-or-later** 许可证:

| 组件 | 版本 | 许可证 | 平台 |
|------|------|--------|------|
| @img/sharp-libvips-darwin-arm64 | 1.2.4 | LGPL-3.0-or-later | macOS ARM64 |
| @img/sharp-libvips-darwin-x64 | 1.2.4 | LGPL-3.0-or-later | macOS x64 |
| @img/sharp-libvips-linux-arm | 1.2.4 | LGPL-3.0-or-later | Linux ARM |
| @img/sharp-libvips-linux-arm64 | 1.2.4 | LGPL-3.0-or-later | Linux ARM64 |
| @img/sharp-libvips-linuxmusl-arm64 | 1.2.4 | LGPL-3.0-or-later | Linux MUSL ARM64 |
| @img/sharp-libvips-linuxmusl-x64 | 1.2.4 | LGPL-3.0-or-later | Linux MUSL x64 |
| @img/sharp-libvips-linux-ppc64 | 1.2.4 | LGPL-3.0-or-later | Linux PPC64 |
| @img/sharp-libvips-linux-riscv64 | 1.2.4 | LGPL-3.0-or-later | Linux RISC-V |
| @img/sharp-libvips-linux-s390x | 1.2.4 | LGPL-3.0-or-later | Linux s390x |
| @img/sharp-libvips-linux-x64 | 1.2.4 | LGPL-3.0-or-later | Linux x64 |
| @img/sharp-wasm32 | 0.34.5 | Apache-2.0 | WebAssembly |
| @img/sharp-win32-arm64 | 0.34.5 | LGPL-3.0-or-later | Windows ARM64 |
| @img/sharp-win32-ia32 | 0.34.5 | LGPL-3.0-or-later | Windows x86 |
| @img/sharp-win32-x64 | 0.34.5 | LGPL-3.0-or-later | Windows x64 |

**LGPL-3.0 合规性说明**: 本项目通过 npm 包管理器动态链接使用 sharp,符合 LGPL 许可证要求,不需要开源项目代码。

## 其他依赖

| 组件 | 版本 | 许可证 | 说明 |
|------|------|--------|------|
| @splinetool/runtime | 0.9.526 | 未知 | 3D 渲染 (通过 @lobehub/ui) |
| rc-util | 5.44.4 | MIT | React 工具库 |
| motion | 12.38.0 | MIT | 动画库 |
| next-intl | 4.9.0 | MIT | 国际化 |
| next-themes | 0.4.6 | MIT | 主题切换 |
| react-markdown | 10.1.0 | MIT | Markdown 渲染 |
| xterm | 5.3.0 | MIT | 终端模拟 |
| ws | 8.20.0 | MIT | WebSocket |

## 许可证说明

### MIT 许可证

MIT 许可证是最宽松的开源许可证之一,允许任何人:
- 商业使用
- 修改代码
- 分发代码
- 私有使用

唯一要求是保留原始版权声明和许可证声明。

### Apache-2.0 许可证

Apache-2.0 许可证允许:
- 商业使用
- 修改代码
- 分发代码
- 专利授权
- 私有使用

要求:
- 保留版权和许可证声明
- 包含 NOTICE 文件(如有)
- 说明重大变更

### LGPL-3.0 许可证

LGPL-3.0 (Lesser General Public License) 允许:
- 商业使用
- 修改代码
- 分发代码
- 私有使用

要求:
- 保留版权和许可证声明
- **动态链接**: 使用时不需要开源主程序
- **静态链接**: 需要提供目标文件以便重新链接

本项目通过 npm 动态链接使用 sharp,符合 LGPL 要求。

### MPL-2.0 许可证

MPL-2.0 (Mozilla Public License) 允许:
- 商业使用
- 修改代码
- 分发代码
- 私有使用

要求:
- 修改的文件需要开源
- 保留版权和许可证声明
- 可以与其他许可证代码组合

## 联系信息

如有许可证相关问题,请联系:
- 项目维护者: Jyf0214
- GitHub: https://github.com/Jyf0214/AutocodeLLM
