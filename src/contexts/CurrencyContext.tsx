import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, getCurrencyFromLocation } from '../lib/currency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('NGN');

  useEffect(() => {
    const initCurrency = async () => {
      const saved = localStorage.getItem('oba_ela_currency') as Currency;
      if (saved) {
        setCurrency(saved);
      } else {
        const detected = await getCurrencyFromLocation();
        setCurrency(detected);
      }
    };
    initCurrency();
  }, []);

  const handleSetCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem('oba_ela_currency', c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
