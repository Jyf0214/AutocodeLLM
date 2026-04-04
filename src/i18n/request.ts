import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'zh';

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const messages = (await import(`./messages/${locale}/common.json`)).default as Record<string, unknown>;

  return {
    locale,
    messages,
  };
});
