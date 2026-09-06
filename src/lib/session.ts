// Client-side session and voter identification helper
const SESSION_KEY = 'fanbase_anon_session_id';
const COUNTRY_KEY = 'fanbase_voter_country';

export function getAnonymousSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'anon_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export interface VoterCountry {
  country: string;
  countryCode: string;
}

export function getVoterCountry(): VoterCountry {
  const cached = localStorage.getItem(COUNTRY_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  // Detect country from browser timezone or locale
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let country = 'United States';
  let countryCode = 'US';

  if (timeZone.includes('London') || timeZone.includes('Europe/London')) {
    country = 'United Kingdom';
    countryCode = 'GB';
  } else if (timeZone.includes('Paris') || timeZone.includes('Berlin') || timeZone.includes('Rome') || timeZone.includes('Madrid')) {
    country = 'Europe';
    countryCode = 'EU';
  } else if (timeZone.includes('Lagos') || timeZone.includes('Nigeria')) {
    country = 'Nigeria';
    countryCode = 'NG';
  } else if (timeZone.includes('Kampala') || timeZone.includes('Nairobi')) {
    country = 'Uganda';
    countryCode = 'UG';
  } else if (timeZone.includes('Tokyo') || timeZone.includes('Seoul')) {
    country = 'Japan';
    countryCode = 'JP';
  } else if (timeZone.includes('Toronto') || timeZone.includes('Vancouver')) {
    country = 'Canada';
    countryCode = 'CA';
  } else if (timeZone.includes('Sydney') || timeZone.includes('Melbourne')) {
    country = 'Australia';
    countryCode = 'AU';
  } else if (timeZone.includes('Sao_Paulo') || timeZone.includes('Buenos_Aires')) {
    country = 'Brazil';
    countryCode = 'BR';
  }

  const detected = { country, countryCode };
  localStorage.setItem(COUNTRY_KEY, JSON.stringify(detected));
  return detected;
}

export function setVoterCountry(country: string, countryCode: string) {
  localStorage.setItem(COUNTRY_KEY, JSON.stringify({ country, countryCode }));
}

// Local cache of categories already voted in this session to optimize UI states
const VOTED_CATEGORIES_KEY = 'fanbase_voted_categories';

export function getVotedCategories(): Record<string, string> {
  try {
    const raw = localStorage.getItem(VOTED_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markCategoryVoted(categoryId: string, candidateId: string) {
  const current = getVotedCategories();
  current[categoryId] = candidateId;
  localStorage.setItem(VOTED_CATEGORIES_KEY, JSON.stringify(current));
}
