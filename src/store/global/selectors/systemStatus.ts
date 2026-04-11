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

import { type GlobalState } from '../initialState';
import { INITIAL_STATUS } from '../initialState';

export const systemStatus = (s: GlobalState) => s.status;

const agentBuilderPanelWidth = (s: GlobalState) => s.status.agentBuilderPanelWidth || 360;

const sessionGroupKeys = (s: GlobalState): string[] =>
  s.status.expandSessionGroupKeys || INITIAL_STATUS.expandSessionGroupKeys;

const topicGroupKeys = (s: GlobalState): string[] | undefined => s.status.expandTopicGroupKeys;

const topicPageSize = (s: GlobalState): number => s.status.topicPageSize || 20;

const agentPageSize = (s: GlobalState): number => s.status.agentPageSize || 5;

const recentPageSize = (s: GlobalState): number => s.status.recentPageSize || 5;

const pagePageSize = (s: GlobalState): number => s.status.pagePageSize || 20;

const hiddenSidebarSections = (s: GlobalState): string[] => s.status.hiddenSidebarSections || [];
const sidebarSectionOrder = (s: GlobalState): string[] =>
  s.status.sidebarSectionOrder || ['recents', 'agent'];
const showSystemRole = (s: GlobalState) => s.status.showSystemRole;
const mobileShowTopic = (s: GlobalState) => s.status.mobileShowTopic;
const mobileShowPortal = (s: GlobalState) => s.status.mobileShowPortal;
const showRightPanel = (s: GlobalState) => !s.status.zenMode && s.status.showRightPanel;
const showLeftPanel = (s: GlobalState) => !s.status.zenMode && s.status.showLeftPanel;
const showFilePanel = (s: GlobalState) => s.status.showFilePanel;
const showImagePanel = (s: GlobalState) => s.status.showImagePanel;
const showImageTopicPanel = (s: GlobalState) => s.status.showImageTopicPanel;
const hidePWAInstaller = (s: GlobalState) => s.status.hidePWAInstaller;
const isShowCredit = (s: GlobalState) => s.status.isShowCredit;
const language = (s: GlobalState) => s.status.language || 'auto';
const modelSwitchPanelGroupMode = (s: GlobalState) =>
  s.status.modelSwitchPanelGroupMode || 'byProvider';
const modelSwitchPanelWidth = (s: GlobalState) => s.status.modelSwitchPanelWidth || 460;
const pageAgentPanelWidth = (s: GlobalState) => s.status.pageAgentPanelWidth || 360;

const showChatHeader = (s: GlobalState) => !s.status.zenMode;
const inZenMode = (s: GlobalState) => s.status.zenMode;
const leftPanelWidth = (s: GlobalState): number => {
  const width = s.status.leftPanelWidth;
  return typeof width === 'string' ? Number.parseInt(width) : width;
};
const portalWidth = (s: GlobalState) => s.status.portalWidth || 400;
const filePanelWidth = (s: GlobalState) => s.status.filePanelWidth;
const groupAgentBuilderPanelWidth = (s: GlobalState) => s.status.groupAgentBuilderPanelWidth || 360;
const imagePanelWidth = (s: GlobalState) => s.status.imagePanelWidth;
const imageTopicViewMode = (s: GlobalState) => s.status.imageTopicViewMode || 'grid';
const imageTopicPanelWidth = (s: GlobalState) => s.status.imageTopicPanelWidth;
const videoPanelWidth = (s: GlobalState) => s.status.videoPanelWidth;
const videoTopicViewMode = (s: GlobalState) => s.status.videoTopicViewMode || 'grid';
const videoTopicPanelWidth = (s: GlobalState) => s.status.videoTopicPanelWidth;
const showVideoPanel = (s: GlobalState) => s.status.showVideoPanel;
const showVideoTopicPanel = (s: GlobalState) => s.status.showVideoTopicPanel;
const wideScreen = (s: GlobalState) => !s.status.noWideScreen;
const chatInputHeight = (s: GlobalState) => s.status.chatInputHeight || 64;
const expandInputActionbar = (s: GlobalState) => s.status.expandInputActionbar;
const isStatusInit = (s: GlobalState) => !!s.isStatusInit;

const getAgentSystemRoleExpanded =
  (agentId: string) =>
  (s: GlobalState): boolean => {
    const map = s.status.systemRoleExpandedMap || {};
    return map[agentId] === true; // System role is collapsed by default
  };

const disabledModelProvidersSortType = (s: GlobalState) =>
  s.status.disabledModelProvidersSortType || 'default';
const disabledModelsSortType = (s: GlobalState) => s.status.disabledModelsSortType || 'default';

const isNotificationRead =
  (slug: string) =>
  (s: GlobalState): boolean => {
    const slugs = s.status.readNotificationSlugs || [];
    return slugs.includes(slug);
  };
const tokenDisplayFormatShort = (s: GlobalState) =>
  s.status.tokenDisplayFormatShort !== undefined ? s.status.tokenDisplayFormatShort : true;

export const systemStatusSelectors = {
  agentBuilderPanelWidth,
  agentPageSize,
  chatInputHeight,
  disabledModelProvidersSortType,
  disabledModelsSortType,
  expandInputActionbar,
  filePanelWidth,
  getAgentSystemRoleExpanded,
  groupAgentBuilderPanelWidth,
  hiddenSidebarSections,
  hidePWAInstaller,
  imagePanelWidth,
  imageTopicViewMode,
  imageTopicPanelWidth,
  inZenMode,
  isNotificationRead,
  isShowCredit,
  isStatusInit,
  language,
  leftPanelWidth,
  mobileShowPortal,
  mobileShowTopic,
  modelSwitchPanelGroupMode,
  modelSwitchPanelWidth,
  pageAgentPanelWidth,
  pagePageSize,
  portalWidth,
  recentPageSize,
  sidebarSectionOrder,
  sessionGroupKeys,
  showChatHeader,
  showFilePanel,
  showImagePanel,
  showImageTopicPanel,
  showLeftPanel,
  showRightPanel,
  showSystemRole,
  showVideoPanel,
  showVideoTopicPanel,
  systemStatus,
  tokenDisplayFormatShort,
  topicGroupKeys,
  topicPageSize,
  videoPanelWidth,
  videoTopicViewMode,
  videoTopicPanelWidth,
  wideScreen,
};
