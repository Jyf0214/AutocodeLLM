import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'zh';

  const messagesModule = await import(`./messages/${locale}/common.json`) as { default: Record<string, unknown> };
  const messages = messagesModule.default;

  return {
    locale,
    messages,
  };
});
