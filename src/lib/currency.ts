export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  rate: number; // Rate relative to NGN (Naira is base)
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  NGN: { code: 'NGN', symbol: '₦', rate: 1 },
  USD: { code: 'USD', symbol: '$', rate: 0.00065 }, // Example rate
  GBP: { code: 'GBP', symbol: '£', rate: 0.00052 }, // Example rate
  EUR: { code: 'EUR', symbol: '€', rate: 0.00061 }, // Example rate
};

export const formatCurrency = (amount: number, currency: Currency = 'NGN') => {
  const config = CURRENCIES[currency];
  const convertedAmount = amount * config.rate;
  
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: config.code,
    currencyDisplay: 'symbol',
  }).format(convertedAmount).replace(config.code, config.symbol);
};

export const getCurrencyFromLocation = async (): Promise<Currency> => {
  try {
    const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    const countryCode = data.country_code;
    
    if (countryCode === 'NG') return 'NGN';
    if (countryCode === 'US') return 'USD';
    if (countryCode === 'GB') return 'GBP';
    if (['DE', 'FR', 'IT', 'ES', 'NL', 'BE'].includes(countryCode)) return 'EUR';
    
    return 'NGN'; // Default to Naira
  } catch {
    // Silently fail and return default currency to avoid console noise in restricted environments
    return 'NGN';
  }
};
