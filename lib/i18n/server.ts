import { cookies } from "next/headers";

import { defaultLocale, localeCookieName, messages, type Locale, type Messages } from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const locale = store.get(localeCookieName)?.value;
  return locale === "es" || locale === "en" ? locale : defaultLocale;
}

export async function getServerMessages(locale?: Locale): Promise<Messages> {
  const resolved = locale ?? (await getServerLocale());
  return messages[resolved];
}
