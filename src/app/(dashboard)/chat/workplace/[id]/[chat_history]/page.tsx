import { redirect } from 'next/navigation';

interface RedirectPageProps {
  params: Promise<{ id: string; chat_history?: string }>;
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const resolvedParams = await params;
  const { id, chat_history } = resolvedParams;

  const targetPath = chat_history
    ? `/workplace/${id}/chat/${chat_history}`
    : `/workplace/${id}/chat`;

  redirect(targetPath);
}