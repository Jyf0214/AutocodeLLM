# Mantine UI 迁移设计规范

## 目标
将项目从 antd 迁移到 Mantine UI，统一全站视觉风格，提升代码质量和开发体验。

## 主题配置

```tsx
<MantineProvider
  theme={{
    primaryColor: 'dark',
    defaultRadius: 'md',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif",
    fontSizes: { md: '14px' },
  }}
/>
```

## 组件映射

| antd | Mantine | 使用规约 |
|------|---------|---------|
| Card | Card | shadow="sm" withBorder padding="lg" |
| Button | Button | filled 主操作 / outline 次操作 / subtle 文字 |
| Form | useForm + TextInput | 验证用 useForm |
| Table | Table | 原生 table，简洁 |
| Modal | Modal | centered size="md" |
| message | notifications | @mantine/notifications |
| Tag | Badge | variant="light" |
| Spin | Loader | size="md" |
| Skeleton | Skeleton | — |
| Switch | Switch | — |
| Input | TextInput | withAsterisk 必填 |
| Select | Select | — |
| Divider | Divider | — |
| Space | Group / Stack | gap="sm" / "md" / "lg" |
| Popconfirm | Popover | — |
| Upload | FileInput | — |
| Progress | Progress | — |
| Empty | Center + Text | — |
| Tooltip | Tooltip | — |

## 图标映射

所有 `@ant-design/icons` → `@tabler/icons-react`
命名规则: `IconXxx` (PascalCase)，前缀 Icon
尺寸约定: 按钮内 16-18px，装饰/标题 20-24px

## 页面布局规范

```
Container size="lg"
  Stack gap="lg"
    Title + 描述文字
    Card(s) shadow="sm" withBorder padding="lg"
```

## 交互反馈

- 加载中: Skeleton（行数匹配内容）
- 空状态: Stack align="center" + Text c="dimmed"
- 操作成功: notifications.show({ color: 'green' })
- 操作失败: notifications.show({ color: 'red' })
- 错误状态: Alert color="red" title="错误" + 重试按钮

## 间距体系

页面 padding: md (16px)
Stack gap: lg (20px)
Card padding: lg (16px)
Group gap: sm (8px)
表单字段间距: md (12px)

## 兼容策略

迁移期间 MantineProvider + AntdRegistry 同时保留，逐页面替换 antd 引用。
先替换 @/lib/ui 中已存在的 antd 组件引用（Button, Form, Input, Switch 等），最终移除 antd 依赖。
