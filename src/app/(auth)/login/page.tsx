'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  MobileOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { CustomButton, PageTransition } from '@/lib/ui';

type LoginMode = 'password' | 'verificationCode';

interface LoginResponse {
  success: boolean;
  data?: { userId: string; username: string; role: string; forceChangePassword: boolean; };
  error?: { message: string; code: string };
}

interface CodeResponse {
  success: boolean;
  error?: { message: string };
  data?: { message: string };
}

const modeTabs: { key: LoginMode; icon: typeof LockOutlined; labelKey: string }[] = [
  { key: 'password', icon: LockOutlined, labelKey: 'passwordLogin' },
  { key: 'verificationCode', icon: SafetyOutlined, labelKey: 'codeLogin' },
];

export default function LoginPage() {
  const t = useTranslations('login');
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const handleSendCode = useCallback(async () => {
    if (!username.trim()) { message.warning(t('enterUsernameFirst')); return; }
    setCodeLoading(true);
    try {
      const res = await fetch('/api/auth/verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const result: CodeResponse = await res.json();
      if (result.success) {
        message.success(t('codeSent'));
        setCountdown(60);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        message.error(result.error?.message ?? t('codeSendFailed'));
      }
    } catch { message.error(t('networkError')); }
    finally { setCodeLoading(false); }
  }, [username, t]);

  const handleSubmit = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!username.trim()) { message.warning(t('usernameRequired')); return; }
    if (loginMode === 'password' && !password) { message.warning(t('passwordRequired')); return; }
    if (loginMode === 'verificationCode' && !verificationCode) { message.warning(t('verificationCodeRequired')); return; }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        username: username.trim(),
        useVerificationCode: loginMode === 'verificationCode',
      };
      if (loginMode === 'password') body.password = password;
      else body.verificationCode = verificationCode;

      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result: LoginResponse = await res.json();

      if (result.success && result.data) {
        if (result.data.forceChangePassword) {
          message.warning(t('firstLoginWarning'));
          router.push('/change-password');
        } else {
          message.success(t('loginSuccess'));
          router.push('/project');
        }
      } else {
        const errorCode = result.error?.code;
        const errorMap: Record<string, string> = {
          USER_NOT_FOUND: 'userNotFound',
          INVALID_CREDENTIALS: 'wrongPassword',
          CODE_EXPIRED: 'codeExpired',
          INVALID_CODE: 'codeInvalid',
        };
        message.error(errorCode && errorMap[errorCode] ? t(errorMap[errorCode]) : (result.error?.message ?? t('loginFailed')));
      }
    } catch { message.error(t('networkError')); }
    finally { setLoading(false); }
  }, [username, password, verificationCode, loginMode, router, t]);

  return (
    <PageTransition className="min-h-dvh flex items-center justify-center p-6"
         style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm animate-fade-in">

        {/* 标题 */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
               style={{ background: 'var(--bg-primary)' }}>
            <UserOutlined style={{ fontSize: 24, color: 'var(--text-primary)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('title')}</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{t('subtitle')}</p>
        </div>

        {/* 模式切换 */}
        <div className="flex gap-1 p-1 mb-6 rounded-xl border"
             style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          {modeTabs.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setLoginMode(key); }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                loginMode === key
                  ? 'shadow-sm bg-white text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Icon style={{ fontSize: 14 }} />
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* 用户名 */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
                   style={{ color: 'var(--text-secondary)' }}>{t('username')}</label>
            <div className="relative">
              <UserOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2"
                            style={{ fontSize: 15, color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); }}
                placeholder={t('usernamePlaceholder')}
                className="w-full h-11 pl-10 pr-3 rounded-xl border text-sm outline-none transition-all duration-200 focus:border-zinc-800"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* 密码 */}
          {loginMode === 'password' ? (
            <div>
              <label className="block text-sm font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>{t('password')}</label>
              <div className="relative">
                <LockOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2"
                              style={{ fontSize: 15, color: 'var(--text-tertiary)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); }}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border text-sm outline-none transition-all duration-200 focus:border-zinc-800"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>{t('verificationCode')}</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MobileOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                  style={{ fontSize: 15, color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => { setVerificationCode(e.target.value); }}
                    placeholder={t('verificationCodePlaceholder')}
                    maxLength={12}
                    className="w-full h-11 pl-10 pr-3 rounded-xl border text-sm outline-none transition-all duration-200 focus:border-zinc-800"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={codeLoading || countdown > 0}
                  className="shrink-0 h-11 px-4 rounded-xl text-sm font-medium border transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-primary)',
                    color: countdown > 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  }}
                >
                  {codeLoading ? '...' : countdown > 0 ? `${String(countdown)}s` : t('getCode')}
                </button>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <CustomButton
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={loading}
            className="mt-2"
          >
            {loginMode === 'password' ? t('submitPassword') : t('submitCode')}
            <ArrowRightOutlined style={{ fontSize: 14 }} />
          </CustomButton>

          {/* 提示 */}
          {loginMode === 'verificationCode' && (
            <p className="text-xs text-center mt-2"
               style={{ color: 'var(--text-tertiary)' }}>
              {t('codeHint')}
            </p>
          )}
        </form>
      </div>
    </PageTransition>
  );
}
