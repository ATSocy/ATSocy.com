const SITE_URL = process.env.SITE_URL || 'https://atsocy.com';

export const SITE = {
  title: 'ATSocy',
  description: 'ATSocy — collective action that transcends time and space.',
  tagline: 'Collective action that transcends time and space',
  url: SITE_URL,
  author: 'ATSocy',
  language: 'en',
} as const;
