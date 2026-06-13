'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Modal } from 'antd';
import { CustomButton, StatusTag } from '@/lib/ui';
import { ProCard } from '@/ui';
import {
  CloudServerOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  RightOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

interface SyncStatus { enabled: boolean; watching: boolean; url: string; remotePath: string; }
interface ProjectBackupStatus { projectId: string; projectName: string; lastBackup: string | null; status: 'ok' | 'failed' | 'no_backup'; }
interface CloudOverview { sync: SyncStatus | null; projectBackups: ProjectBackupStatus[]; }
interface ApiResponse { success: boolean; data?: CloudOverview; error?: { message: string }; }

export default function CloudPage() {
  const router = useRouter();
  const t = useTranslations('cloud');
  const [overview, setOverview] = useState<CloudOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backingUpId, setBackingUpId] = useState<string | null>(null);
  const [backupLogs, setBackupLogs] = useState<{timestamp: string; projectId: string; projectName: string; status: string; message: string}[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cloud/overview');
        const data: ApiResponse = await res.json();
        if (data.success && data.data) setOverview(data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleBackupNow = async (projectId: string, _projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBackingUpId(projectId);
    try {
      const res = await fetch('/api/cloud/backup-now', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (data.success) fetchBackupLogs();
    } catch { /* ignore */ }
    finally { setBackingUpId(null); }
  };

  const fetchBackupLogs = async () => {
    try {
      const res = await fetch('/api/cloud/backup-now');
      const data = await res.json();
      if (data.success && data.data) setBackupLogs(data.data);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingOutlined spin style={{ fontSize: 32, color: 'var(--text-tertiary)' }} />
      </div>
    );
  }

  const statusTag = !overview?.sync?.enabled
    ? <StatusTag color="default">{t('notConfigured')}</StatusTag>
    : overview.sync.watching
      ? <StatusTag color="success">{t('syncing')}</StatusTag>
      : <StatusTag color="info">{t('configured')}</StatusTag>;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 animate-fade-in">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('title')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('description')}</p>
      </div>

      {/* WebDAV 状态 */}
      <ProCard className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('webdavSyncStatus')}</h3>
          {statusTag}
        </div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('serverUrl')}</span>
          <span className="text-xs break-all text-right" style={{ color: 'var(--text-primary)' }}>
            {overview?.sync?.url ?? t('notConfigured')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('remotePath')}</span>
          <span className="text-xs break-all text-right" style={{ color: 'var(--text-primary)' }}>
            {overview?.sync?.remotePath ?? t('notConfigured')}
          </span>
        </div>
      </ProCard>

      {/* 快速入口 */}
      <ProCard className="mb-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('quickAccess')}</h3>
        <div className="flex flex-wrap gap-2">
          <CustomButton variant="primary" icon={<CloudServerOutlined />} onClick={() => router.push('/cloud/webdav')}>
            {t('webdavConfig')}
          </CustomButton>
          <CustomButton variant="default" icon={<CloudDownloadOutlined />} onClick={() => router.push('/cloud/backups')}>
            {t('backupMonitor')}
          </CustomButton>
        </div>
      </ProCard>

      {/* 项目备份状态 */}
      <ProCard>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('projectBackupStatus')}</h3>
        {overview?.projectBackups && overview.projectBackups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {overview.projectBackups.map((ws) => (
              <div
                key={ws.projectId}
                className="flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm border border-transparent hover:border-zinc-200"
                style={{ background: 'var(--bg-secondary)' }}
                onClick={() => router.push(`/project/${ws.projectId}/backups`)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white"
                       style={{ background: 'var(--text-primary)' }}>
                    {ws.projectName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {ws.projectName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {ws.status === 'ok'
                    ? <StatusTag color="success">{t('backedUp')}</StatusTag>
                    : ws.status === 'failed'
                      ? <StatusTag color="error">{t('backupFailed')}</StatusTag>
                      : <StatusTag color="default">{t('notBackedUp')}</StatusTag>
                  }
                  <button
                    type="button"
                    onClick={(e) => handleBackupNow(ws.projectId, ws.projectName, e)}
                    className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-zinc-100"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {backingUpId === ws.projectId
                      ? <LoadingOutlined spin style={{ fontSize: 13 }} />
                      : <PlayCircleOutlined style={{ fontSize: 14 }} />
                    }
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fetchBackupLogs(); setBackupModalOpen(true); }}
                    className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-zinc-100"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <CloudUploadOutlined style={{ fontSize: 13 }} />
                  </button>
                  <RightOutlined style={{ fontSize: 11, color: 'var(--text-tertiary)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
            {t('noProjectData')}
          </p>
        )}
      </ProCard>

      {/* 备份日志弹窗 */}
      <Modal title={t('backupLogs') || '备份日志'}
        open={backupModalOpen}
        onCancel={() => setBackupModalOpen(false)}
        footer={null}
        width={600}
      >
        {backupLogs.filter((log) => overview?.projectBackups.some((ws) => ws.projectId === log.projectId)).length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>{t('noLogs') || '暂无日志'}</p>
        ) : (
          <div className="flex flex-col max-h-96 overflow-y-auto">
            {backupLogs
              .filter((log) => overview?.projectBackups?.some((ws) => ws.projectId === log.projectId))
              .slice(0, 20)
              .map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-b-0"
                     style={{ borderColor: 'var(--border-primary)' }}>
                  <span className="shrink-0" style={{ color: item.status === 'success' ? '#16a34a' : item.status === 'failed' ? '#dc2626' : 'var(--text-primary)' }}>
                    {item.status === 'running'
                      ? <LoadingOutlined spin />
                      : item.status === 'success'
                        ? <CheckCircleOutlined />
                        : <CloseCircleOutlined />
                    }
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.projectName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{item.message}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(item.timestamp).toLocaleString('zh-CN')}
                  </span>
                </div>
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
