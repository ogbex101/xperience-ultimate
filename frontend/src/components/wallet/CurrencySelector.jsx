// frontend/src/components/wallet/CurrencySelector.jsx
import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { walletAPI } from '../../utils/api';

const CurrencySelector = ({ currentCurrency, onCurrencyChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await walletAPI.getCurrencies();
      if (response.success) {
        setCurrencies(response.currencies);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleCurrencySelect = async (currency) => {
    setLoading(true);
    try {
      const response = await walletAPI.setCurrency(currency.code);
      if (response.success) {
        onCurrencyChange(currency.code);
        setShowDropdown(false);
        window.location.reload(); // Refresh to update all balances
      }
    } catch (error) {
      console.error('Error changing currency:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCurrency = () => {
    return currencies.find(c => c.code === currentCurrency) || currencies[0];
  };

  const current = getCurrentCurrency();

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
        disabled={loading}
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium">{current?.code || currentCurrency}</span>
        <span className="text-gray-400 text-sm">{current?.symbol}</span>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-purple-800/30 rounded-xl shadow-2xl z-50">
            <div className="p-3 border-b border-gray-700">
              <p className="text-sm text-gray-400">Select Currency</p>
            </div>
            <div className="py-2">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors ${
                    currency.code === currentCurrency ? 'bg-purple-900/30' : ''
                  }`}
                  disabled={loading}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-xs">{currency.symbol}</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-xs text-gray-400">{currency.name}</div>
                    </div>
                  </div>
                  {currency.code === currentCurrency && (
                    <Check className="h-4 w-4 text-green-400" />
                  )}
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Rates update daily
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;