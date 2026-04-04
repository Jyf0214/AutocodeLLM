import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

type Messages = Record<string, string>;

interface MessagesModule {
  default: Messages;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'zh';

  const messagesModule = (await import(
    `./messages/${locale}/common.json`
  )) as unknown as MessagesModule;

  return {
    locale,
    messages: messagesModule.default,
  };
});
