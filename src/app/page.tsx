import AppLayout from '@/components/layout/AppLayout';

export default function Home() {
  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1>AutocodeLLM</h1>
        <p>AI 编码代理平台</p>
      </div>
    </AppLayout>
  );
}
