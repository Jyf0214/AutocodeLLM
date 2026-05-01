'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { GithubOutlined, GoogleOutlined } from '@ant-design/icons';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [githubAvailable, setGithubAvailable] = useState(false);

  useEffect(() => {
    fetch('/api/auth/github')
      .then((r) => r.json())
      .then((d) => setGithubAvailable(d.success))
      .catch(() => setGithubAvailable(false));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!email.trim()) { message.warning('请输入用户名'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.trim(), useVerificationCode: true }),
      });
      const data = await res.json();
      if (data.success) { router.push('/project'); }
      else { message.error(data.error?.message || '登录失败'); }
    } catch { message.error('网络错误'); }
    finally { setLoading(false); }
  }, [email, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      padding: 24,
    }}>
      {/* 头部 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{
          width: 48, height: 48,
          borderRadius: 12,
          background: '#f5f5f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#111827', margin: 0 }}>登录</h1>
      </div>

      {/* 卡片 */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: '32px 32px 40px',
      }}>
        {/* 邮箱 */}
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#4b5563', marginBottom: 8 }}>
          用户名
        </label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="admin"
          autoFocus
          style={{
            width: '100%', height: 44,
            padding: '0 16px', fontSize: 15,
            color: '#111827', background: '#fff',
            border: '1px solid #d1d5db', borderRadius: 8,
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#000')}
          onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
        />

        {/* 继续按钮 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', height: 44, marginTop: 20,
            fontSize: 15, fontWeight: 500,
            color: '#fff', background: '#000',
            border: 'none', borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '登录中...' : '继续'}
        </button>

        {/* 分割线 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 12, color: '#6b7280' }}>或</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        {/* 第三方登录 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => message.info('Google 登录即将支持')}
            style={{
              width: '100%', height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 14, fontWeight: 500, color: '#111827',
              background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <GoogleOutlined style={{ fontSize: 18 }} />
            使用 Google 继续
          </button>

          {githubAvailable && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/auth/github');
                  const data = await res.json();
                  if (data.success?.data?.url) window.location.href = data.data.url;
                } catch { message.error('获取授权链接失败'); }
              }}
              style={{
                width: '100%', height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 14, fontWeight: 500, color: '#111827',
                background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <GithubOutlined style={{ fontSize: 18 }} />
              使用 GitHub 继续
            </button>
          )}
        </div>

        {/* 注册引导 */}
        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: '#6b7280' }}>
          还没有账户？{' '}
          <a href="/login" style={{ color: '#000', fontWeight: 600, textDecoration: 'none' }}>
            注册
          </a>
        </p>
      </div>

      {/* 页脚 */}
      <p style={{ marginTop: 64, fontSize: 12, color: '#9ca3af' }}>
        AutocodeLLM
      </p>
    </div>
  );
}