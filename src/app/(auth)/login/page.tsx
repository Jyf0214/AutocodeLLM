'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import {
  GithubOutlined,
  GoogleOutlined,
  ArrowRightOutlined,
  MailOutlined,
} from '@ant-design/icons';

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
    if (!email.trim()) {
      message.warning('请输入用户名');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.trim(), useVerificationCode: true }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/project');
      } else {
        message.error(data.error?.message || '登录失败');
      }
    } catch {
      message.error('网络错误');
    } finally {
      setLoading(false);
    }
  }, [email, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
        }}
      >
        {/* 标题 */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            marginBottom: 40,
            letterSpacing: '-0.5px',
          }}
        >
          登录
        </h1>

        {/* 邮箱输入 */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 500,
              color: '#888',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
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
              width: '100%',
              height: 48,
              padding: '0 0 12px 0',
              fontSize: 16,
              color: '#fff',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #333',
              borderRadius: 0,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = '#fff')}
            onBlur={(e) => (e.target.style.borderBottomColor = '#333')}
          />
        </div>

        {/* 继续按钮 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            height: 48,
            marginTop: 24,
            fontSize: 15,
            fontWeight: 600,
            color: '#000',
            background: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? '登录中...' : '继续'}
          {!loading && <ArrowRightOutlined style={{ fontSize: 16 }} />}
        </button>

        {/* 分隔线 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            margin: '32px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, background: '#222' }} />
          <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>或</span>
          <div style={{ flex: 1, height: 1, background: '#222' }} />
        </div>

        {/* 第三方登录 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => message.info('Google 登录即将支持')}
            style={{
              width: '100%',
              height: 48,
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#666')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333')}
          >
            <GoogleOutlined style={{ fontSize: 18 }} />
            使用 Google 登录
          </button>

          {githubAvailable && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/auth/github');
                  const data = await res.json();
                  if (data.success && data.data.url) {
                    window.location.href = data.data.url;
                  }
                } catch {
                  message.error('获取授权链接失败');
                }
              }}
              style={{
                width: '100%',
                height: 48,
                fontSize: 14,
                fontWeight: 500,
                color: '#fff',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#666')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333')}
            >
              <GithubOutlined style={{ fontSize: 18 }} />
              使用 GitHub 登录
            </button>
          )}
        </div>

        {/* 底部 */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 40,
            fontSize: 12,
            color: '#444',
          }}
        >
          AutocodeLLM
        </p>
      </div>
    </div>
  );
}