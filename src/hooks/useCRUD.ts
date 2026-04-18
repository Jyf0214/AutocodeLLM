'use client';

import { useState, useCallback } from 'react';
import { message } from 'antd';

export interface CRUDItem {
  id: string;
  [key: string]: unknown;
}

export interface CRUDOptions<T extends CRUDItem> {
  apiPath: string;
  itemName?: string;
  onSuccess?: (action: 'create' | 'update' | 'delete', data?: T) => void;
  onError?: (action: 'create' | 'update' | 'delete', error: Error) => void;
}

export interface UseCRUDReturn<T extends CRUDItem> {
  loading: boolean;
  list: T[];
  setList: React.Dispatch<React.SetStateAction<T[]>>;
  fetchList: () => Promise<void>;
  create: (data: Omit<T, 'id'>) => Promise<boolean>;
  update: (id: string, data: Partial<T>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export function useCRUD<T extends CRUDItem>(
  options: CRUDOptions<T>
): UseCRUDReturn<T> {
  const { apiPath, itemName = '数据', onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<T[]>([]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath);
      const result: { success: boolean; data?: T[]; error?: { message: string } } = await res.json();
      if (result.success) {
        setList(result.data ?? []);
      } else {
        message.error(result.error?.message ?? `获取${itemName}列表失败`);
      }
    } catch {
      message.error(`获取${itemName}列表失败`);
    } finally {
      setLoading(false);
    }
  }, [apiPath, itemName]);

  const create = useCallback(
    async (data: Omit<T, 'id'>): Promise<boolean> => {
      setLoading(true);
      try {
        const res = await fetch(apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result: { success: boolean; data?: T; error?: { message: string } } = await res.json();
        if (result.success) {
          message.success(`${itemName}创建成功`);
          onSuccess?.('create', result.data);
          await fetchList();
          return true;
        } else {
          message.error(result.error?.message ?? `创建${itemName}失败`);
          onError?.('create', new Error(result.error?.message ?? `创建${itemName}失败`));
          return false;
        }
      } catch {
        message.error(`创建${itemName}失败`);
        onError?.('create', new Error(`创建${itemName}失败`));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apiPath, itemName, fetchList, onSuccess, onError]
  );

  const update = useCallback(
    async (id: string, data: Partial<T>): Promise<boolean> => {
      setLoading(true);
      try {
        const res = await fetch(apiPath, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...data }),
        });
        const result: { success: boolean; data?: T; error?: { message: string } } = await res.json();
        if (result.success) {
          message.success(`${itemName}更新成功`);
          onSuccess?.('update', result.data);
          await fetchList();
          return true;
        } else {
          message.error(result.error?.message ?? `更新${itemName}失败`);
          onError?.('update', new Error(result.error?.message ?? `更新${itemName}失败`));
          return false;
        }
      } catch {
        message.error(`更新${itemName}失败`);
        onError?.('update', new Error(`更新${itemName}失败`));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apiPath, itemName, fetchList, onSuccess, onError]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      try {
        const res = await fetch(`${apiPath}?id=${id}`, { method: 'DELETE' });
        const result: { success: boolean; error?: { message: string } } = await res.json();
        if (result.success) {
          message.success(`${itemName}删除成功`);
          onSuccess?.('delete');
          await fetchList();
          return true;
        } else {
          message.error(result.error?.message ?? `删除${itemName}失败`);
          onError?.('delete', new Error(result.error?.message ?? `删除${itemName}失败`));
          return false;
        }
      } catch {
        message.error(`删除${itemName}失败`);
        onError?.('delete', new Error(`删除${itemName}失败`));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apiPath, itemName, fetchList, onSuccess, onError]
  );

  return { loading, list, setList, fetchList, create, update, remove };
}