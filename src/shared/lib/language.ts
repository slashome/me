export const SITE_LANG = 'fr';

const names = new Intl.DisplayNames([SITE_LANG], { type: 'language' });

export function languageName(code: string): string {
  try {
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}
