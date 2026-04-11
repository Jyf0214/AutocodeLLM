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

/**
 * SWR localStorage Cache Provider
 *
 * Provides localStorage persistence for selected SWR requests.
 * Only keys matching the whitelist patterns will be cached to localStorage.
 *
 * @example
 * ```tsx
 * <SWRConfig value={{ provider: createLocalStorageProvider() }}>
 *   <App />
 * </SWRConfig>
 * ```
 */

interface CacheEntry<T = unknown> {
  /** Cached data */
  data: T;
  /** Cache timestamp */
  timestamp: number;
  /** App version */
  version: string;
}

export interface LocalStorageCacheOptions {
  /** Allowed SWR key patterns (whitelist) */
  cacheablePatterns?: string[];
  /** localStorage key name, defaults to 'lobechat-swr-cache' */
  cacheKey?: string;
  /** Maximum cache entries, defaults to 50 */
  maxEntries?: number;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Cache TTL in milliseconds, defaults to 24 hours */
  ttl?: number;
  /** App version, cache is cleared when version changes */
  version?: string;
}

/**
 * Default cacheable SWR key patterns
 * Only requests matching these patterns will be persisted
 */
const DEFAULT_CACHEABLE_PATTERNS: string[] = [
  // Add patterns as needed
];

/**
 * Check if localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__swr_cache_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if key matches whitelist patterns
 *
 * SWR keys can be:
 * - String: 'fetchSessions'
 * - Serialized array: '["fetchSessions","user-123"]'
 *
 * We check if the key string contains any whitelist pattern
 */
const matchesCacheablePattern = (key: string, patterns: string[]): boolean => {
  if (patterns.length === 0) return false;
  return patterns.some((pattern) => key.includes(pattern));
};

/**
 * Create localStorage cache provider
 *
 * Features:
 * - Whitelist mechanism: only cache specified keys
 * - TTL expiration: auto-cleanup expired data
 * - Version control: auto-cleanup when app version changes
 * - Capacity limit: prevent exceeding localStorage limit
 * - SSR compatible: returns empty Map on server
 * - Error recovery: fallback to memory cache on error
 */
export function createLocalStorageProvider(options: LocalStorageCacheOptions = {}) {
  const {
    cacheKey = 'lobechat-swr-cache',
    ttl = 24 * 60 * 60 * 1000, // 24 hours
    maxEntries = 50,
    version = '1.0.0',
    cacheablePatterns = DEFAULT_CACHEABLE_PATTERNS,
    onError = (error) => console.error('[SWR Cache]', error),
  } = options;

  // Return memory cache when SSR or localStorage unavailable
  if (!isLocalStorageAvailable()) {
    return () => new Map();
  }

  return (): Map<string, unknown> => {
    /**
     * Load cache from localStorage
     */
    const loadCache = (): Map<string, unknown> => {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (!stored) {
          return new Map();
        }

        const entries: [string, CacheEntry][] = JSON.parse(stored);
        const now = Date.now();

        // Filter: expired data, version mismatch
        const validEntries = entries
          .filter(([, entry]) => {
            const isExpired = now - entry.timestamp > ttl;
            const isValidVersion = entry.version === version;
            return !isExpired && isValidVersion;
          })
          .map(([key, entry]) => [key, entry.data] as [string, unknown]);

        return new Map(validEntries);
      } catch (error) {
        onError(error as Error);
        return new Map();
      }
    };

    const initialData = loadCache();

    // Debounced save variables (outside class to avoid initialization order issues)
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let cacheMapInstance: Map<string, unknown> | null = null;

    const saveCache = () => {
      if (!cacheMapInstance) return;
      try {
        // Only save whitelisted keys
        const entries = Array.from(cacheMapInstance.entries())
          .filter(([key]) => matchesCacheablePattern(key, cacheablePatterns))
          .slice(-maxEntries)
          .map(([key, data]) => [key, { data, timestamp: Date.now(), version } as CacheEntry]);

        const serialized = JSON.stringify(entries);

        // Check size, cleanup half when exceeding 4MB
        const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
        if (sizeInMB > 4) {
          const reduced = entries.slice(-Math.floor(maxEntries / 2));
          localStorage.setItem(cacheKey, JSON.stringify(reduced));
          console.warn(`[SWR Cache] Cache too large (${sizeInMB.toFixed(2)}MB), cleaned up`);
        } else {
          localStorage.setItem(cacheKey, serialized);
        }
      } catch (error) {
        if ((error as DOMException).name === 'QuotaExceededError') {
          // Quota exceeded, clear cache
          try {
            localStorage.removeItem(cacheKey);
          } catch {
            // ignore
          }
          console.error('[SWR Cache] Quota exceeded, cache cleared');
        } else {
          onError(error as Error);
        }
      }
    };

    const debouncedSave = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(saveCache, 2000);
    };

    // Save immediately on page unload
    window.addEventListener('beforeunload', () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveCache();
    });

    // Multi-tab sync
    window.addEventListener('storage', (event) => {
      if (event.key === cacheKey && event.newValue && cacheMapInstance) {
        try {
          const parsedEntries: [string, CacheEntry][] = JSON.parse(event.newValue);
          // Only update whitelisted keys
          parsedEntries.forEach(([key, entry]) => {
            if (matchesCacheablePattern(key, cacheablePatterns)) {
              cacheMapInstance!.set(key, entry.data);
            }
          });
        } catch (error) {
          onError(error as Error);
        }
      }
    });

    /**
     * Create Map with interception
     * Only whitelisted keys trigger persistence
     */
    class LocalStorageCacheMap extends Map<string, unknown> {
      private initialized = false;

      constructor(entries?: readonly (readonly [string, unknown])[] | null) {
        super();
        // Manually add initial data to avoid triggering set in super()
        if (entries) {
          for (const [key, value] of entries) {
            super.set(key, value);
          }
        }
        this.initialized = true;
      }

      get(key: string): unknown {
        return super.get(key);
      }

      set(key: string, value: unknown): this {
        super.set(key, value);
        // Only trigger save after initialization and for whitelisted keys
        if (this.initialized && matchesCacheablePattern(key, cacheablePatterns)) {
          debouncedSave();
        }
        return this;
      }

      delete(key: string): boolean {
        const result = super.delete(key);
        if (this.initialized && matchesCacheablePattern(key, cacheablePatterns)) {
          debouncedSave();
        }
        return result;
      }
    }

    // Create Map instance
    const cacheMap = new LocalStorageCacheMap(Array.from(initialData.entries()));
    cacheMapInstance = cacheMap;

    return cacheMap;
  };
}

/**
 * Clear SWR localStorage cache
 * Can be used for manual cleanup or when app version changes
 */
export function clearSWRCache(cacheKey = 'lobechat-swr-cache'): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(cacheKey);
    console.info('[SWR Cache] Cache cleared');
  } catch (error) {
    console.error('[SWR Cache] Failed to clear cache:', error);
  }
}

/**
 * SWR localStorage cache whitelist
 * Only keys matching these patterns will be persisted to localStorage
 */
const SWR_CACHEABLE_PATTERNS = [
  // Home page data
  'fetchAgentList', // Agent list
  'fetchGroups', // Group list
  'fetchRecentTopics', // Recent topics
  'fetchRecentResources', // Recent resources
  'fetchRecentPages', // Recent pages
  'fetchRecents', // Unified recents
  // Chat page data
  'SWR_USE_FETCH_TOPIC', // Topic list (cached per agentId/groupId)
  'fetchGroupDetail', // Group detail (cached per groupId)
  'CONVERSATION_FETCH_MESSAGES', // Messages (cached per agentId/topicId)
];

/**
 * Export provider factory function for SWRConfig
 */
export const swrCacheProvider = () => {
  return createLocalStorageProvider({
    cacheablePatterns: SWR_CACHEABLE_PATTERNS,
    ttl: 12 * 60 * 60 * 1000, // 12 hours
  });
};
