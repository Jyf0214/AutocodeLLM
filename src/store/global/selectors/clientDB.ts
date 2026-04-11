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

import { type GlobalState } from '@/store/global/initialState';

const initClientDBMigrationSqls = (s: GlobalState) => {
  return s.initClientDBMigrations?.sqls || [];
};

const displayMigrationStatus = (s: GlobalState) => {
  const sql = s.initClientDBMigrations?.sqls || [];
  const tableRecords = s.initClientDBMigrations?.tableRecords || [];

  return (
    sql

      .map((item, index) => {
        const recordInTable = tableRecords.find((record) => record.hash === item.hash);
        return {
          createdAt: new Date(item.folderMillis),
          desc: item.sql[0],
          folderMillis: item.folderMillis,
          id: item.hash,
          index: index + 1,
          migratedAt: recordInTable ? new Date(recordInTable.created_at) : undefined,
          sql: item.sql,
          status: !!recordInTable ? 'success' : 'error',
        };
      })
      // Sort by time in descending order
      .sort((a, b) => b.folderMillis - a.folderMillis)
  );
};

const errorMigrations = (s: GlobalState) => {
  const sql = s.initClientDBMigrations?.sqls || [];
  const tableRecords = s.initClientDBMigrations?.tableRecords || [];

  return sql.filter((item) => !tableRecords.some((record) => record.hash === item.hash));
};

export const clientDBSelectors = {
  displayMigrationStatus,
  errorMigrations,
  initClientDBMigrationSqls,
};
