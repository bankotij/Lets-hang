// Currency conversion utility
// Base currency is USD (all prices stored in cents)

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AUD' | 'CAD' | 'JPY' | 'CNY' | 'BRL' | 'MXN';

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // Rate from USD
  locale: string;
};

// Exchange rates (approximate - in production, fetch from an API)
const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, locale: 'en-GB' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83, locale: 'en-IN' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53, locale: 'en-AU' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36, locale: 'en-CA' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149, locale: 'ja-JP' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24, locale: 'zh-CN' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 4.97, locale: 'pt-BR' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', rate: 17.15, locale: 'es-MX' },
};

// Country to currency mapping
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  US: 'USD',
  GB: 'GBP',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR',
  IN: 'INR',
  AU: 'AUD',
  CA: 'CAD',
  JP: 'JPY',
  CN: 'CNY',
  BR: 'BRL',
  MX: 'MXN',
};

// Detect user's currency based on timezone/locale
function detectUserCurrency(): CurrencyCode {
  try {
    // Try to get from browser locale
    const locale = navigator.language || 'en-US';
    const regionCode = locale.split('-')[1]?.toUpperCase();
    
    if (regionCode && COUNTRY_TO_CURRENCY[regionCode]) {
      return COUNTRY_TO_CURRENCY[regionCode];
    }
    
    // Try to infer from timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta')) return 'INR';
    if (timezone.includes('Europe/London')) return 'GBP';
    if (timezone.includes('Europe/')) return 'EUR';
    if (timezone.includes('Asia/Tokyo')) return 'JPY';
    if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Hong_Kong')) return 'CNY';
    if (timezone.includes('Australia/')) return 'AUD';
    if (timezone.includes('America/Sao_Paulo')) return 'BRL';
    if (timezone.includes('America/Mexico_City')) return 'MXN';
    if (timezone.includes('America/Toronto') || timezone.includes('America/Vancouver')) return 'CAD';
    
    // Default to USD
    return 'USD';
  } catch {
    return 'USD';
  }
}

// Store the detected currency
let userCurrency: CurrencyCode | null = null;

export function getUserCurrency(): CurrencyInfo {
  if (!userCurrency) {
    userCurrency = detectUserCurrency();
  }
  return CURRENCIES[userCurrency];
}

export function setUserCurrency(code: CurrencyCode): void {
  userCurrency = code;
  localStorage.setItem('preferred_currency', code);
}

// Initialize from localStorage if available
export function initCurrency(): void {
  const stored = localStorage.getItem('preferred_currency') as CurrencyCode | null;
  if (stored && CURRENCIES[stored]) {
    userCurrency = stored;
  }
}

// Convert USD cents to local currency
export function convertFromUSD(usdCents: number): number {
  const currency = getUserCurrency();
  return Math.round(usdCents * currency.rate);
}

// Convert local currency to USD cents
export function convertToUSD(localAmount: number): number {
  const currency = getUserCurrency();
  return Math.round(localAmount / currency.rate);
}

// Format price in user's local currency
export function formatPrice(usdCents: number): string {
  if (usdCents === 0) return 'Free';
  
  const currency = getUserCurrency();
  const localAmount = convertFromUSD(usdCents);
  
  // For currencies like JPY that don't use decimals
  const useDecimals = !['JPY', 'CNY'].includes(currency.code);
  
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: useDecimals ? 2 : 0,
    maximumFractionDigits: useDecimals ? 2 : 0,
  }).format(localAmount / 100);
}

// Format price range
export function formatPriceRange(minCents: number, maxCents: number): string {
  if (minCents === maxCents) {
    return formatPrice(minCents);
  }
  
  const currency = getUserCurrency();
  const minLocal = convertFromUSD(minCents);
  const maxLocal = convertFromUSD(maxCents);
  const useDecimals = !['JPY', 'CNY'].includes(currency.code);
  
  const formatter = new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: useDecimals ? 2 : 0,
    maximumFractionDigits: useDecimals ? 2 : 0,
  });
  
  if (minCents === 0) {
    return `Free - ${formatter.format(maxLocal / 100)}`;
  }
  
  return `${formatter.format(minLocal / 100)} - ${formatter.format(maxLocal / 100)}`;
}

// Format money (never shows "Free", always shows amount)
export function formatMoney(usdCents: number): string {
  const currency = getUserCurrency();
  const localAmount = convertFromUSD(usdCents);
  const useDecimals = !['JPY', 'CNY'].includes(currency.code);
  
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: useDecimals ? 2 : 0,
    maximumFractionDigits: useDecimals ? 2 : 0,
  }).format(localAmount / 100);
}

// Get all available currencies for selection
export function getAllCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCIES);
}

// Format in USD (for display alongside local currency)
export function formatUSD(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// Initialize on module load
initCurrency();
