import { useState } from 'react';
import { getUserCurrency, setUserCurrency, getAllCurrencies, type CurrencyCode } from '../utils/currency';

export function CurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const currentCurrency = getUserCurrency();
  const currencies = getAllCurrencies();

  function handleSelect(code: CurrencyCode) {
    setUserCurrency(code);
    setIsOpen(false);
    // Trigger a re-render by reloading
    window.location.reload();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 hover:text-white transition-colors"
      >
        <span>{currentCurrency.symbol}</span>
        <span className="text-xs">{currentCurrency.code}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 max-h-64 overflow-auto rounded-xl bg-zinc-900 border border-white/10 shadow-xl z-50">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => handleSelect(currency.code)}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-white/5 transition-colors ${
                  currency.code === currentCurrency.code ? 'bg-purple-500/10 text-purple-400' : 'text-white/70'
                }`}
              >
                <span className="w-6 text-center">{currency.symbol}</span>
                <span className="flex-1">{currency.name}</span>
                <span className="text-white/40 text-xs">{currency.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
