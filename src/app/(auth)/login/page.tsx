'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
// 移除了 @ant-design/icons，改用更规范的原生 SVG，提升质感

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [githubAvailable, setGithubAvailable] = useState(false);

  // 检查 GitHub 登录是否可用
  useEffect(() => {
    fetch('/api/auth/github')
      .then((r) => r.json())
      .then((d) => setGithubAvailable(d.success))
      .catch(() => setGithubAvailable(false));
  },[]);

  // 处理登录逻辑
  const handleSubmit = useCallback(async () => {
    if (!email.trim()) {
      message.warning('请输入邮箱地址');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 保持你后端的传参结构不变
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 font-sans selection:bg-gray-200">
      
      {/* 1. 头部 Logo 与标题区 */}
      <div className="flex flex-col items-center mb-6">
        {/* 这里用 SVG 画了一个简单的抽象动物面部，替代 Ollama 的羊驼，你也可以换成你们项目的标准 Logo */}
        <svg 
          className="w-12 h-12 mb-3 text-black" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M8 8v-3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"/>
          <rect x="5" y="8" width="14" height="12" rx="4"/>
          <circle cx="9" cy="13" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="13" r="1.5" fill="currentColor" stroke="none"/>
          <path d="M10 16a2 2 0 0 0 4 0"/>
        </svg>
        <h1 className="text-[28px] font-semibold text-[#111827]">登录</h1>
      </div>

      {/* 2. 核心登录卡片 */}
      <div className="w-full max-w-[420px] bg-white rounded-[16px] border border-gray-200 px-8 py-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        
        {/* 邮箱输入区 */}
        <div className="mb-5">
          <label className="block text-[14px] font-normal text-gray-600 mb-2">
            邮箱
          </label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="您的邮箱地址"
            autoFocus
            className="w-full h-[40px] px-4 rounded-[8px] border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
        </div>

        {/* 核心动作按钮 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-[44px] bg-black text-white text-[15px] font-medium rounded-[8px] flex items-center justify-center transition-all hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {loading ? '登录中...' : '继续'}
        </button>

        {/* 分割线 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-[1px] bg-gray-200" />
          <span className="text-[12px] text-gray-500 bg-white">或</span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        {/* 第三方 OAuth 登录区 */}
        <div className="flex flex-col gap-3 mb-8">
          <button
            onClick={() => message.info('Google 登录即将支持')}
            className="w-full h-[42px] flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-[8px] text-[14px] text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {/* 注入灵魂：标准的 Google 彩色 Logo */}
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            使用 Google 继续
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
              className="w-full h-[42px] flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-[8px] text-[14px] text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {/* 注入灵魂：标准的 GitHub 纯黑 Logo */}
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              使用 GitHub 继续
            </button>
          )}
        </div>

        {/* 底部注册入口 */}
        <div className="text-center text-[14px] text-gray-500">
          还没有账户？{' '}
          <span className="font-semibold text-black hover:underline cursor-pointer">
            注册
          </span>
        </div>

      </div>

      {/* 3. 页面全局底部页脚 */}
      <div className="mt-12 text-[13px] text-gray-400">
        <a href="#" className="hover:text-gray-900 transition-colors">服务条款</a>
        {' 和 '}
        <a href="#" className="hover:text-gray-900 transition-colors">隐私政策</a>
      </div>
      
    </div>
  );
}