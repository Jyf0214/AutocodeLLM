'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PageContainer, Button, Flexbox, Text } from '@/lib/ui';
import {
  FolderOutlined,
  FileOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
  HomeOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import {
  message,
  Table,
  Modal,
  Input,
  Breadcrumb,
  Tooltip,
  Popconfirm,
  Space,
  Dropdown,
  Empty,
  Spin,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FileInfo, ApiResponse } from './types';

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i] ?? ''}`;
}

/** 格式化时间 */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 获取文件扩展名图标颜色 */
function getExtColor(_ext: string): string {
  return 'var(--text-primary)';
}

/** 文件图标组件 */
function FileTypeIcon({ type, ext }: { type: 'file' | 'directory'; ext: string }) {
  if (type === 'directory') {
    return <FolderOutlined style={{ fontSize: 20, color: 'var(--text-primary)' }} />;
  }
  return <FileOutlined style={{ fontSize: 20, color: getExtColor(ext) }} />;
}

export default function FilesPage() {
  const t = useTranslations('files');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 弹窗状态
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileInfo | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FileInfo | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const uploadRef = useRef<HTMLDivElement>(null);

  /** 获取文件列表 */
  const fetchFiles = useCallback(async (dirPath?: string) => {
    const targetPath = dirPath ?? currentPath;
    setLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(targetPath)}`);
      const result: ApiResponse<{ files: FileInfo[]; currentPath: string }> = await res.json();
      if (result.success && result.data) {
        setFiles(result.data.files);
        setCurrentPath(result.data.currentPath);
      } else {
        message.error(result.error?.message ?? t('fetchFailed'));
      }
    } catch {
      message.error(t('networkError'));
    } finally {
      setLoading(false);
    }
  }, [currentPath, t]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/files?path=${encodeURIComponent('/')}`);
        const result: ApiResponse<{ files: FileInfo[]; currentPath: string }> = await res.json();
        if (result.success && result.data) {
          setFiles(result.data.files);
          setCurrentPath(result.data.currentPath);
        } else {
          message.error(result.error?.message ?? t('fetchFailed'));
        }
      } catch {
        message.error(t('networkError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  /** 面包屑路径 */
  const breadcrumbPaths = currentPath
    .split('/')
    .filter(Boolean)
    .reduce<{ label: string; path: string }[]>((acc, segment) => {
      const prev = acc.length > 0 ? (acc[acc.length - 1]?.path ?? '') : '';
      const segPath = `${prev}/${segment}`;
      acc.push({ label: segment, path: segPath });
      return acc;
    }, []);

  /** 导航到目录 */
  const navigateTo = useCallback((dirPath: string) => {
    setSelectedRowKeys([]);
    fetchFiles(dirPath);
  }, [fetchFiles]);

  /** 创建文件/目录 */
  const handleCreate = useCallback(async () => {
    if (!createName.trim()) {
      message.warning(t('nameRequired'));
      return;
    }

    setCreateLoading(true);
    try {
      const newPath = currentPath === '/'
        ? `/${createName.trim()}`
        : `${currentPath}/${createName.trim()}`;

      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath, type: createType, content: '' }),
      });
      const result: ApiResponse<{ path: string }> = await res.json();

      if (result.success) {
        message.success(t('createSuccess'));
        setCreateModalOpen(false);
        setCreateName('');
        fetchFiles();
      } else {
        message.error(result.error?.message ?? t('createFailed'));
      }
    } catch {
      message.error(t('networkError'));
    } finally {
      setCreateLoading(false);
    }
  }, [createName, createType, currentPath, fetchFiles, t]);

  /** 删除文件/目录 */
  const handleDelete = useCallback(async (entryPath: string) => {
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(entryPath)}`, {
        method: 'DELETE',
      });
      const result: ApiResponse<unknown> = await res.json();

      if (result.success) {
        message.success(t('deleteSuccess'));
        fetchFiles();
      } else {
        message.error(result.error?.message ?? t('deleteFailed'));
      }
    } catch {
      message.error(t('networkError'));
    }
  }, [fetchFiles, t]);

  /** 重命名 */
  const handleRename = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) {
      message.warning(t('nameRequired'));
      return;
    }

    setRenameLoading(true);
    try {
      const parentPath = renameTarget.path.substring(0, renameTarget.path.lastIndexOf('/')) || '/';
      const newPath = parentPath === '/'
        ? `/${renameValue.trim()}`
        : `${parentPath}/${renameValue.trim()}`;

      const res = await fetch('/api/files/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath: renameTarget.path, newPath }),
      });
      const result: ApiResponse<unknown> = await res.json();

      if (result.success) {
        message.success(t('renameSuccess'));
        setRenameModalOpen(false);
        setRenameTarget(null);
        setRenameValue('');
        fetchFiles();
      } else {
        message.error(result.error?.message ?? t('renameFailed'));
      }
    } catch {
      message.error(t('networkError'));
    } finally {
      setRenameLoading(false);
    }
  }, [renameTarget, renameValue, fetchFiles, t]);

  /** 读取文件内容并打开编辑器 */
  const handleEdit = useCallback(async (file: FileInfo) => {
    setEditTarget(file);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditContent('');

    try {
      const res = await fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`);
      const result: ApiResponse<{ content: string }> = await res.json();

      if (result.success && result.data) {
        setEditContent(result.data.content);
      } else {
        message.error(result.error?.message ?? t('readFailed'));
        setEditModalOpen(false);
      }
    } catch {
      message.error(t('networkError'));
      setEditModalOpen(false);
    } finally {
      setEditLoading(false);
    }
  }, [t]);

  /** 保存文件内容 */
  const handleSaveContent = useCallback(async () => {
    if (!editTarget) return;

    setEditSaving(true);
    try {
      const res = await fetch('/api/files/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: editTarget.path, content: editContent }),
      });
      const result: ApiResponse<unknown> = await res.json();

      if (result.success) {
        message.success(t('saveSuccess'));
        setEditModalOpen(false);
        setEditTarget(null);
        setEditContent('');
        fetchFiles();
      } else {
        message.error(result.error?.message ?? t('saveFailed'));
      }
    } catch {
      message.error(t('networkError'));
    } finally {
      setEditSaving(false);
    }
  }, [editTarget, editContent, fetchFiles, t]);

  /** 下载文件 */
  const handleDownload = useCallback((filePath: string) => {
    const a = document.createElement('a');
    a.href = `/api/files/download?path=${encodeURIComponent(filePath)}`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  /** 上传文件 */
  const handleUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      const result: ApiResponse<unknown> = await res.json();

      if (result.success) {
        message.success(t('uploadSuccess'));
        setUploadOpen(false);
        fetchFiles();
      } else {
        message.error(result.error?.message ?? t('uploadFailed'));
      }
    } catch {
      message.error(t('networkError'));
    }
  }, [currentPath, fetchFiles, t]);

  /** 打开创建弹窗 */
  const openCreate = useCallback((type: 'file' | 'directory') => {
    setCreateType(type);
    setCreateName('');
    setCreateModalOpen(true);
  }, []);

  /** 打开重命名弹窗 */
  const openRename = useCallback((file: FileInfo) => {
    setRenameTarget(file);
    setRenameValue(file.name);
    setRenameModalOpen(true);
  }, []);

  /** 表格列定义 */
  const columns: ColumnsType<FileInfo> = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record: FileInfo) => (
        <Flexbox
          gap={10}
          align="center"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (record.type === 'directory') {
              navigateTo(record.path);
            } else {
              handleEdit(record);
            }
          }}
        >
          <FileTypeIcon type={record.type} ext={record.extension} />
          <Text style={{ fontSize: 14 }}>{name}</Text>
        </Flexbox>
      ),
    },
    {
      title: t('size'),
      dataIndex: 'size',
      key: 'size',
      width: 120,
      sorter: (a, b) => a.size - b.size,
      render: (_: number, record: FileInfo) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {record.type === 'directory' ? '-' : formatSize(record.size)}
        </Text>
      ),
    },
    {
      title: t('type'),
      dataIndex: 'extension',
      key: 'type',
      width: 100,
      sorter: (a, b) => a.extension.localeCompare(b.extension),
      render: (_: string, record: FileInfo) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {record.type === 'directory' ? t('folder') : record.extension || '-'}
        </Text>
      ),
    },
    {
      title: t('modifiedAt'),
      dataIndex: 'modifiedAt',
      key: 'modifiedAt',
      width: 180,
      sorter: (a, b) => new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime(),
      defaultSortOrder: 'descend',
      render: (val: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {formatTime(val)}
        </Text>
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 200,
      render: (_: unknown, record: FileInfo) => (
        <Space size="small">
          {record.type === 'file' && (
            <Tooltip title={t('edit')}>
              <Button
                variant="ghost"
                size="sm"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(record);
                }}
              />
            </Tooltip>
          )}
          {record.type === 'file' && (
            <Tooltip title={t('download')}>
              <Button
                variant="ghost"
                size="sm"
                icon={<DownloadOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(record.path);
                }}
              />
            </Tooltip>
          )}
          <Tooltip title={t('rename')}>
            <Button
              variant="ghost"
              size="sm"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                openRename(record);
              }}
            />
          </Tooltip>
          <Popconfirm
            title={t('confirmDelete')}
            description={t('deleteDesc', { name: record.name })}
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(record.path);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText={t('confirm')}
            cancelText={t('cancel')}
          >
            <Tooltip title={t('delete')}>
              <Button
                variant="dangerGhost"
                size="sm"
                icon={<DeleteOutlined />}
                onClick={(e) => { e.stopPropagation(); }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={t('title')}
      subtitle={t('subtitle')}
      extra={
        <Space>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'file',
                  icon: <FileOutlined />,
                  label: t('newFile'),
                  onClick: () => { openCreate('file'); },
                },
                {
                  key: 'directory',
                  icon: <FolderOutlined />,
                  label: t('newFolder'),
                  onClick: () => { openCreate('directory'); },
                },
              ],
            }}
          >
            <Button icon={<PlusOutlined />}>{t('create')}</Button>
          </Dropdown>
          <Button icon={<UploadOutlined />} onClick={() => { setUploadOpen(true); }}>
            {t('upload')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchFiles()}>
            {t('refresh')}
          </Button>
        </Space>
      }
    >
      {/* 面包屑导航 */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            {
              title: (
                <Flexbox gap={6} align="center" style={{ cursor: 'pointer' }}>
                  <HomeOutlined />
                  <span>{t('root')}</span>
                </Flexbox>
              ),
              onClick: () => { navigateTo('/'); },
            },
            ...breadcrumbPaths.map((seg) => ({
              title: (
                <Flexbox gap={6} align="center" style={{ cursor: 'pointer' }}>
                  <FolderOpenOutlined />
                  <span>{seg.label}</span>
                </Flexbox>
              ),
              onClick: () => { navigateTo(seg.path); },
            })),
          ]}
        />
      </div>

      {/* 文件表格 */}
      <Spin spinning={loading}>
        {!loading && files.length === 0 ? (
          <Empty
            description={t('empty')}
            style={{ padding: '60px 0' }}
          >
            <Space>
              <Button
                variant="primary"
                icon={<PlusOutlined />}
                onClick={() => { openCreate('file'); }}
              >
                {t('newFile')}
              </Button>
              <Button icon={<FolderOutlined />} onClick={() => { openCreate('directory'); }}>
                {t('newFolder')}
              </Button>
            </Space>
          </Empty>
        ) : (
          <Table
            rowKey="path"
            columns={columns}
            dataSource={files}
            pagination={false}
            size="middle"
            showSorterTooltip={false}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => { setSelectedRowKeys(keys); },
            }}
            onRow={(record) => ({
              onDoubleClick: () => {
                if (record.type === 'directory') {
                  navigateTo(record.path);
                } else {
                  handleEdit(record);
                }
              },
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Spin>

      {/* 创建弹窗 */}
      <Modal
        title={createType === 'file' ? t('newFile') : t('newFolder')}
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); }}
        confirmLoading={createLoading}
        okText={t('create')}
        cancelText={t('cancel')}
      >
        <Flexbox gap={8} style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('createIn', { path: currentPath })}
          </Text>
          <Input
            placeholder={createType === 'file' ? t('fileNamePlaceholder') : t('folderNamePlaceholder')}
            value={createName}
            onChange={(e) => { setCreateName(e.target.value); }}
            onPressEnter={handleCreate}
            autoFocus
          />
        </Flexbox>
      </Modal>

      {/* 重命名弹窗 */}
      <Modal
        title={t('rename')}
        open={renameModalOpen}
        onOk={handleRename}
        onCancel={() => {
          setRenameModalOpen(false);
          setRenameTarget(null);
        }}
        confirmLoading={renameLoading}
        okText={t('confirm')}
        cancelText={t('cancel')}
      >
        <Flexbox gap={8} style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('renameDesc', { name: renameTarget?.name ?? '' })}
          </Text>
          <Input
            value={renameValue}
            onChange={(e) => { setRenameValue(e.target.value); }}
            onPressEnter={handleRename}
            autoFocus
          />
        </Flexbox>
      </Modal>

      {/* 编辑文件弹窗 */}
      <Modal
        title={editTarget ? `${t('edit')}: ${editTarget.name}` : t('edit')}
        open={editModalOpen}
        onOk={handleSaveContent}
        onCancel={() => {
          setEditModalOpen(false);
          setEditTarget(null);
          setEditContent('');
        }}
        confirmLoading={editSaving}
        okText={t('save')}
        cancelText={t('cancel')}
        width={800}
        style={{ top: 30 }}
      >
        {editLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <Input.TextArea
            value={editContent}
            onChange={(e) => { setEditContent(e.target.value); }}
            rows={20}
            style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 16 }}
            placeholder={t('editPlaceholder')}
          />
        )}
      </Modal>

      {/* 上传弹窗 */}
      <Modal
        title={t('upload')}
        open={uploadOpen}
        onCancel={() => { setUploadOpen(false); }}
        footer={null}
      >
        <div ref={uploadRef} style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 13, marginBottom: 12, display: 'block' }}>
            {t('uploadTo', { path: currentPath })}
          </Text>
          <Upload.Dragger
            multiple
            showUploadList={false}
            customRequest={({ file }) => {
              handleUpload(file as File);
            }}
            style={{ padding: '20px 0' }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 36, color: 'var(--ant-color-primary)' }} />
            </p>
            <p className="ant-upload-text">{t('uploadDragText')}</p>
            <p className="ant-upload-hint">{t('uploadHint')}</p>
          </Upload.Dragger>
        </div>
      </Modal>
    </PageContainer>
  );
}