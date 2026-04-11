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

import { type HotkeyId } from '@/types/hotkey';
import { type GlobalLLMProviderKey } from '@/types/user/settings';

import { type UserStore } from '../../../store';
import { settingsSelectors } from './settings';

describe('settingsSelectors', () => {
  describe('currentSettings', () => {
    it('should merge DEFAULT_SETTINGS and s.settings correctly', () => {
      const s = {
        settings: {
          avatar: 'avatar.jpg',
          fontSize: 14,
          language: 'en-US',
          neutralColor: 'sand',
          password: 'password123',
          primaryColor: 'blue',
          themeMode: 'light',
          defaultAgent: {
            config: {
              systemRole: '',
              model: 'gpt-3.5-turbo',
              params: {},
              tts: {
                showAllLocaleVoice: false,
                sttLocale: 'auto',
                ttsService: 'openai',
                voice: {
                  openai: 'alloy',
                },
              },
            },
            meta: {
              avatar: 'Default Agent',
              description: 'Default agent for testing',
            },
          },
          tts: {
            openAI: {
              sttModel: 'whisper-1',
              ttsModel: 'tts-1',
            },
            sttAutoStop: true,
            sttServer: 'openai',
          },
          languageModel: {
            openAI: {
              OPENAI_API_KEY: 'openai-api-key',
              endpoint: 'https://openai-endpoint.com',
              models: ['gpt-3.5-turbo'],
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.currentSettings(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('defaultAgent', () => {
    it('should merge DEFAULT_AGENT and s.settings.defaultAgent correctly', () => {
      const s = {
        settings: {
          defaultAgent: {
            config: {
              systemRole: 'user',
              model: 'gpt-3.5-turbo',
            },
            meta: {
              avatar: 'agent-avatar.jpg',
              description: 'Test agent',
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.defaultAgent(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('defaultAgentMeta', () => {
    it('should merge DEFAULT_AGENT_META and defaultAgent(s).meta correctly', () => {
      const s = {
        settings: {
          defaultAgent: {
            meta: {
              avatar: 'agent-avatar.jpg',
              description: 'Test agent',
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.defaultAgentMeta(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('currentTTS', () => {
    it('should merge DEFAULT_TTS_CONFIG and s.settings.tts correctly', () => {
      const s = {
        settings: {
          tts: {
            sttAutoStop: false,
            openAI: {
              sttModel: 'whisper-2',
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.currentTTS(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('getProviderConfigById', () => {
    it('should return the provider config for a given provider id', () => {
      const providerConfig = {
        OPENAI_API_KEY: 'test-key',
        endpoint: 'https://test-endpoint.com',
      };

      const s = {
        settings: {
          languageModel: {
            openAI: providerConfig,
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.providerConfig('openAI')(s);

      expect(result).toEqual(providerConfig);
    });

    it('should return undefined if provider does not exist', () => {
      const s = {
        settings: {
          languageModel: {},
        },
      } as unknown as UserStore;

      const result = settingsSelectors.providerConfig(
        'nonExistentProvider' as GlobalLLMProviderKey,
      )(s);

      expect(result).toBeUndefined();
    });
  });

  describe('defaultAgentConfig', () => {
    it('should merge DEFAULT_AGENT_CONFIG and defaultAgent(s).config correctly', () => {
      const s = {
        settings: {
          defaultAgent: {
            config: {
              systemRole: 'custom role',
              model: 'gpt-4',
              params: {
                temperature: 0.7,
              },
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.defaultAgentConfig(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('exportSettings', () => {
    it('should return the current settings', () => {
      const s = {
        defaultSettings: {
          fontSize: 16,
        },
        settings: {
          fontSize: 14,
          language: 'en-US',
        },
      } as unknown as UserStore;

      const result = settingsSelectors.exportSettings(s);

      expect(result).toEqual({
        fontSize: 14,
        language: 'en-US',
      });
    });
  });

  describe('currentSystemAgent', () => {
    it('should merge DEFAULT_SYSTEM_AGENT_CONFIG and s.settings.systemAgent correctly', () => {
      const s = {
        settings: {
          systemAgent: {
            enableAutoReply: true,
            replyMessage: 'Custom auto reply',
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.currentSystemAgent(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('getHotkeyById', () => {
    it('should return the hotkey config for a given id', () => {
      const hotkeyConfig = {
        hotkey: 'ctrl+shift+f',
        scope: 'global',
      };

      const s = {
        settings: {
          hotkey: {
            newChat: hotkeyConfig,
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.getHotkeyById('newChat' as HotkeyId)(s);

      expect(result).toMatchSnapshot();
    });

    it('should return default hotkey if not defined in settings', () => {
      const s = {
        settings: {
          hotkey: {},
        },
      } as unknown as UserStore;

      const result = settingsSelectors.getHotkeyById('newChat' as HotkeyId)(s);

      expect(result).toMatchSnapshot();
    });
  });
});
