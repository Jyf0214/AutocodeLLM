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

import { DEFAULT_SECURITY_BLACKLIST, InterventionChecker } from '@lobechat/agent-runtime';
import { Alert, Flexbox } from '@lobehub/ui';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface SecurityBlacklistWarningProps {
  args: Record<string, any>;
}

const SecurityBlacklistWarning = memo<SecurityBlacklistWarningProps>(({ args }) => {
  const { t } = useTranslation('tool');

  const securityCheck = useMemo(
    () => InterventionChecker.checkSecurityBlacklist(DEFAULT_SECURITY_BLACKLIST, args),
    [args],
  );

  if (!securityCheck.blocked) return null;

  return (
    <Alert
      showIcon
      title={t('localFiles.securityBlacklist.warning')}
      type="error"
      variant="borderless"
      description={
        <Flexbox gap={4} style={{ fontSize: 12 }}>
          <div>{securityCheck.reason ? t(securityCheck.reason as any) : undefined}</div>
        </Flexbox>
      }
    />
  );
});

SecurityBlacklistWarning.displayName = 'SecurityBlacklistWarning';

export default SecurityBlacklistWarning;
