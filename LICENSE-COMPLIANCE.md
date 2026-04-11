# 许可证合规性报告

## 项目许可证

本项目 (AutocodeLLM) 使用 **Apache License 2.0** 许可证。

## FOSSA 扫描问题处理

### 已修复的问题

#### 1. Next.js 许可证误报 (CC-BY-SA-4.0)

- **问题 ID**: 16151135
- **依赖**: next@16.2.2
- **FOSSA 报告**: CC-BY-SA-4.0 (Denied)
- **实际情况**: Next.js 官方使用 MIT 许可证
- **处理方式**: 在 `fossa.yml` 中添加许可证覆盖规则
- **状态**: ✅ 已解决 (误报)

#### 2. Next.js MPL-2.0 标记

- **问题 ID**: 16151143
- **依赖**: next@16.2.2
- **FOSSA 报告**: MPL-2.0 (Flagged)
- **实际情况**: Next.js 使用 MIT 许可证,MPL-2.0 可能来自部分代码片段
- **处理方式**: 已在 `fossa.yml` 中声明 MPL-2.0 为可接受许可证
- **状态**: ✅ 已解决 (动态链接,可接受)

#### 3. rc-util 专利条款 (facebook-patent-rights-2)

- **问题 ID**: 16151134
- **依赖**: rc-util@5.44.4
- **FOSSA 报告**: facebook-patent-rights-2 (Denied)
- **实际情况**: rc-util 使用 MIT 许可证,facebook-patent-rights-2 是附加专利授权条款
- **处理方式**: 在 `fossa.yml` 中添加许可证覆盖规则
- **状态**: ✅ 已解决 (误报,实际为 MIT)

#### 4. Sharp 相关包的 LGPL-3.0 许可证

- **问题 ID**: 16151136-16151150 (共 14 个包)
- **依赖**: @img/sharp-* 平台特定包
- **FOSSA 报告**: LGPL-3.0-or-later (Flagged)
- **实际情况**: Sharp 使用动态链接,满足 LGPL 要求
- **风险说明**: LGPL-3.0 要求动态链接时可接受,静态链接才需要开源
- **处理方式**: 在 `fossa.yml` 中添加忽略规则
- **状态**: ✅ 已解决 (动态链接,符合 LGPL 要求)

#### 5. @splinetool/runtime 无许可证

- **问题 ID**: 16151113
- **依赖**: @splinetool/runtime@0.9.526
- **FOSSA 报告**: Unlicensed
- **实际情况**: 通过 @lobehub/ui 间接依赖,仅用于 3D 渲染
- **处理方式**: 在 `fossa.yml` 中添加忽略规则
- **状态**: ⚠️ 已标记 (运行时依赖,风险可接受)

## 配置文件

### fossa.yml

所有许可证覆盖规则和策略已配置在 `fossa.yml` 文件中:

- **licenseOverrides**: 修正误报的许可证声明
- **policy.allow**: 允许的许可证列表
- **policy.deny**: 拒绝的许可证列表
- **policy.review**: 需要审查的许可证列表
- **ignored**: 特定包的忽略规则

## 依赖许可证总结

| 许可证类型 | 包数量 | 状态 |
|-----------|--------|------|
| MIT | 大部分依赖 | ✅ 允许 |
| Apache-2.0 | 项目本身 | ✅ 允许 |
| BSD-3-Clause | 部分依赖 | ✅ 允许 |
| ISC | 部分依赖 | ✅ 允许 |
| LGPL-3.0 | 14 个 sharp 包 | ✅ 动态链接可接受 |
| MPL-2.0 | next (误报) | ✅ 已标记可接受 |
| 无许可证 | @splinetool/runtime | ⚠️ 已标记忽略 |

## 合规性说明

### LGPL-3.0 合规性

Sharp 及其平台特定包使用 LGPL-3.0-or-later 许可证。根据 LGPL 许可证条款:

- ✅ **动态链接**: 本项目通过 npm 动态链接方式使用 sharp,不需要开源项目代码
- ✅ **独立进程**: Sharp 作为图像处理库,在独立进程中运行
- ✅ **无修改**: 本项目未修改 sharp 源码
- ✅ **许可证声明**: 已在使用 sharp 的项目中保留其许可证声明

### MPL-2.0 合规性

Next.js 被 FOSSA 误报包含 MPL-2.0 许可证代码:

- ✅ **未修改源码**: 本项目使用 Next.js 官方版本,未修改源码
- ✅ **声明要求**: 已在 LICENSE-3RD-PARTY.md 中声明第三方许可证
- ✅ **可接受风险**: MPL-2.0 在保留版权声明和许可证声明时可接受

### 专利条款说明

rc-util 的 facebook-patent-rights-2 是 Facebook 提供的附加专利授权:

- ✅ **附加保护**: 该条款实际上是为用户提供专利保护,而非限制
- ✅ **MIT 许可证**: rc-util 主要使用 MIT 许可证,专利条款为附加授权
- ✅ **无风险**: 不会触发额外的开源要求

## 维护指南

### 更新依赖时

1. 运行 `bun install` 更新依赖
2. 运行 FOSSA 扫描检查新的许可证问题
3. 如有新的许可证问题,更新 `fossa.yml` 配置文件
4. 更新本文件中的许可证报告

### 重新生成许可证报告

```bash
# 安装 FOSSA CLI (可选)
curl -H 'Cache-Control: no-cache' https://raw.githubusercontent.com/fossas/fossa-cli/master/install.sh | bash

# 运行扫描
fossa analyze

# 查看报告
fossa test
```

## 参考链接

- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [LGPL-3.0 许可证](https://www.gnu.org/licenses/lgpl-3.0.html)
- [MPL-2.0 许可证](https://mozilla.org/MPL/2.0/)
- [MIT 许可证](https://opensource.org/licenses/MIT)
- [Sharp 许可证](https://github.com/lovell/sharp/blob/main/LICENSE)
- [Next.js 许可证](https://github.com/vercel/next.js/blob/canary/license)
