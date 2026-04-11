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

import { produce } from 'immer';

import {
  type FileUploadState,
  type FileUploadStatus,
  type UploadFileItem,
} from '@/types/files/upload';

interface AddFile {
  atStart?: boolean;
  file: UploadFileItem;
  type: 'addFile';
}

interface AddFiles {
  atStart?: boolean;
  files: UploadFileItem[];
  type: 'addFiles';
}

interface UpdateFile {
  id: string;
  type: 'updateFile';
  value: Partial<UploadFileItem>;
}

interface UpdateFileStatus {
  id: string;
  status: FileUploadStatus;
  type: 'updateFileStatus';
}

interface UpdateFileStatuses {
  ids: string[];
  status: FileUploadStatus;
  type: 'updateFileStatuses';
}

interface UpdateFileUploadState {
  id: string;
  type: 'updateFileUploadState';
  uploadState: FileUploadState;
}

interface RemoveFile {
  id: string;
  type: 'removeFile';
}

interface RemoveFiles {
  ids: string[];
  type: 'removeFiles';
}

export type UploadFileListDispatch =
  | AddFile
  | UpdateFileStatus
  | UpdateFileStatuses
  | UpdateFileUploadState
  | RemoveFile
  | AddFiles
  | UpdateFile
  | RemoveFiles;

export const uploadFileListReducer = (
  state: UploadFileItem[],
  action: UploadFileListDispatch,
): UploadFileItem[] => {
  switch (action.type) {
    case 'addFile': {
      return produce(state, (draftState) => {
        const { atStart, file } = action;

        if (atStart) {
          draftState.unshift(file);
        } else {
          draftState.push(file);
        }
      });
    }

    case 'addFiles': {
      return produce(state, (draftState) => {
        const { atStart, files } = action;

        for (const file of files) {
          if (atStart) {
            draftState.unshift(file);
          } else {
            draftState.push(file);
          }
        }
      });
    }
    case 'updateFile': {
      return produce(state, (draftState) => {
        const file = draftState.find((f) => f.id === action.id);
        if (file) {
          Object.assign(file, action.value);
        }
      });
    }

    case 'updateFileStatus': {
      return produce(state, (draftState) => {
        const file = draftState.find((f) => f.id === action.id);
        if (file) {
          file.status = action.status;
        }
      });
    }

    case 'updateFileStatuses': {
      return produce(state, (draftState) => {
        const ids = new Set(action.ids);

        for (const file of draftState) {
          if (ids.has(file.id)) {
            file.status = action.status;
          }
        }
      });
    }

    case 'updateFileUploadState': {
      return produce(state, (draftState) => {
        const file = draftState.find((f) => f.id === action.id);
        if (file) {
          file.uploadState = action.uploadState;
        }
      });
    }

    case 'removeFile': {
      return produce(state, (draftState) => {
        const index = draftState.findIndex((f) => f.id === action.id);
        if (index !== -1) {
          draftState.splice(index, 1);
        }
      });
    }

    case 'removeFiles': {
      return produce(state, (draftState) => {
        for (const id of action.ids) {
          const index = draftState.findIndex((f) => f.id === id);
          if (index !== -1) {
            draftState.splice(index, 1);
          }
        }
      });
    }
    default: {
      throw new Error('Unhandled action type');
    }
  }
};
