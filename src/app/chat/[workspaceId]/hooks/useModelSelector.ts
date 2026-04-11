/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import { useCallback, useState, useEffect } from 'react';
import { message } from 'antd';
import type { ModelConfig } from '../store/types';

/**
 * 模型选择Hook
 */
export function useModelSelector() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      try {
        const [modelsRes, providersRes] = await Promise.all([
          fetch('/api/models'),
          fetch('/api/providers'),
        ]);

        const modelsData = (await modelsRes.json()) as {
          success: boolean;
          data?: { id: string; name: string; provider: string; enabled: boolean }[];
        };
        const providersData = (await providersRes.json()) as {
          success: boolean;
          data?: { id: string; name: string; sdkType: string; authType: string; enabled: boolean }[];
        };

        const items: ModelConfig[] = [];

        // 合并模型配置
        if (modelsData.success && modelsData.data) {
          for (const m of modelsData.data) {
            if (m.enabled) {
              items.push({
                id: m.id,
                name: m.name,
                provider: m.provider,
                providerId: m.id,
                enabled: m.enabled,
                sdkType: 'openai',
                authType: 'apiKey',
              });
            }
          }
        }

        // 合并提供商
        if (providersData.success && providersData.data) {
          for (const p of providersData.data) {
            if (p.enabled && !items.find((i) => i.id === p.id)) {
              items.push({
                id: p.id,
                name: p.name,
                provider: p.name,
                providerId: p.id,
                enabled: p.enabled,
                sdkType: p.sdkType,
                authType: p.authType,
              });
            }
          }
        }

        setModels(items);
        if (items.length > 0) {
          setSelectedModelId(items[0]?.id ?? null);
        }
      } catch {
        message.error('获取模型列表失败');
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // 选中的模型
  const selectedModel = models.find((m) => m.id === selectedModelId) ?? null;

  // 选择模型
  const selectModel = useCallback(
    (modelId: string) => {
      setSelectedModelId(modelId);
    },
    []
  );

  return {
    models,
    selectedModel,
    selectedModelId,
    selectModel,
    loading,
  };
}
