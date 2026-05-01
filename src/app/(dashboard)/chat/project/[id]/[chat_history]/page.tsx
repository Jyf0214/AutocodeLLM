import { redirect } from 'next/navigation';

interface RedirectPageProps {
  params: Promise<{ id: string; chat_history?: string }>;
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const resolvedParams = await params;
  const { id, chat_history } = resolvedParams;

  const targetPath = chat_history
    ? `/project/${id}/chat/${chat_history}`
    : `/project/${id}/chat`;

  redirect(targetPath);
}