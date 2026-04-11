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

import { type SWRResponse } from 'swr';

import { type AgentCronJob } from '@/database/schemas/agentCronJob';
import { mutate, useClientDataSWR } from '@/libs/swr';
import { lambdaClient } from '@/libs/trpc/client/lambda';
import { agentCronJobService } from '@/services/agentCronJob';
import { type StoreSetter } from '@/store/types';

import { type AgentStore } from '../../store';

const FETCH_CRON_TOPICS_WITH_JOB_INFO_KEY = 'cronTopicsWithJobInfo';

export interface CronTopicGroupWithJobInfo {
  cronJob: AgentCronJob | null;
  cronJobId: string;
  topics: Array<{
    createdAt: Date | string;
    favorite?: boolean | null;
    historySummary?: string | null;
    id: string;
    metadata?: any;
    title?: string | null;
    trigger?: string | null;
    updatedAt: Date | string;
  }>;
}

/**
 * Cron Slice Actions
 * Handles agent cron job operations
 */

type Setter = StoreSetter<AgentStore>;
export const createCronSlice = (set: Setter, get: () => AgentStore, _api?: unknown) =>
  new CronSliceActionImpl(set, get, _api);

export class CronSliceActionImpl {
  readonly #get: () => AgentStore;

  constructor(set: Setter, get: () => AgentStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  createAgentCronJob = async (): Promise<string | null> => {
    const { activeAgentId, internal_refreshCronTopics } = this.#get();
    if (!activeAgentId) return null;

    try {
      const result = await agentCronJobService.create({
        agentId: activeAgentId,
        content: '',
        cronPattern: '*/30 * * * *',
        enabled: false,
      });

      if (result.success) {
        await internal_refreshCronTopics();
        return result.data.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create cron job:', error);
      return null;
    }
  };

  internal_refreshCronTopics = async (): Promise<void> => {
    await mutate([FETCH_CRON_TOPICS_WITH_JOB_INFO_KEY, this.#get().activeAgentId]);
  };

  useFetchCronTopicsWithJobInfo = (
    agentId?: string,
    enabled: boolean = true,
  ): SWRResponse<CronTopicGroupWithJobInfo[]> => {
    return useClientDataSWR<CronTopicGroupWithJobInfo[]>(
      enabled && agentId ? [FETCH_CRON_TOPICS_WITH_JOB_INFO_KEY, agentId] : null,
      async ([, id]: [string, string]) => {
        const [cronJobsResult, cronTopicsGroups] = await Promise.all([
          lambdaClient.agentCronJob.findByAgent.query({ agentId: id }),
          lambdaClient.topic.getCronTopicsGroupedByCronJob.query({ agentId: id }),
        ]);

        const cronJobs = cronJobsResult.success ? cronJobsResult.data : [];
        const topicsByCronId = new Map(
          cronTopicsGroups.map((group) => [group.cronJobId, group.topics]),
        );
        const cronJobIds = new Set(cronJobs.map((job) => job.id));

        const groupsWithJobs = cronJobs.map((job) => ({
          cronJob: job,
          cronJobId: job.id,
          topics: topicsByCronId.get(job.id) || [],
        }));

        const orphanGroups = cronTopicsGroups
          .filter((group) => !cronJobIds.has(group.cronJobId))
          .map((group) => ({
            cronJob: null,
            cronJobId: group.cronJobId,
            topics: group.topics,
          }));

        return [...groupsWithJobs, ...orphanGroups];
      },
      {
        fallbackData: [],
        revalidateOnFocus: false,
      },
    );
  };
}

export type CronSliceAction = Pick<CronSliceActionImpl, keyof CronSliceActionImpl>;
