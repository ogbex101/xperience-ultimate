import React, { useState } from 'react';
import { CreditCard, X, Loader } from 'lucide-react';
import { walletAPI } from '../../utils/api';
// CORRECT IMPORT:
// CORRECT IMPORT:
import * as FlutterwaveReact from 'flutterwave-react-v3';

const FundWalletModal = ({ onClose, onSuccess, currency = 'NGN' }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [flutterwaveConfig, setFlutterwaveConfig] = useState(null);

  const presetAmounts = [500, 1000, 2000, 5000, 10000, 20000];

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!amount || amount <= 0) {
    setError('Please enter a valid amount');
    return;
  }

  setLoading(true);
  setError('');
  
  try {
    const response = await walletAPI.initializePayment(parseFloat(amount), currency);
    
    if (response.success) {
      // Create a form to redirect to Flutterwave
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://checkout.flutterwave.com/v3/hosted/pay';
      
      // Add all required parameters
      const params = {
        public_key: response.flutterwave_config.public_key,
        tx_ref: response.flutterwave_config.tx_ref,
        amount: response.flutterwave_config.amount,
        currency: response.flutterwave_config.currency,
        redirect_url: response.flutterwave_config.redirect_url,
        customer: JSON.stringify(response.flutterwave_config.customer),
        customizations: JSON.stringify(response.flutterwave_config.customizations)
      };
      
      Object.keys(params).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
      
    } else {
      setError(response.message || 'Payment initialization failed');
      setLoading(false);
    }
  } catch (err) {
    setError(err.message || 'An error occurred. Please try again.');
    setLoading(false);
  }
};

  const handlePresetClick = (presetAmount) => {
    setAmount(presetAmount);
    setError('');
    setFlutterwaveConfig(null); // Reset config when amount changes
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-800/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-900/30 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold">Fund Your Wallet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-800/50 rounded-lg text-green-300">
              {success}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setFlutterwaveConfig(null); // Reset config when amount changes
                }}
                placeholder="Enter amount"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="100"
                step="100"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {currency}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Quick Select</p>
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`py-2 rounded-lg transition-all duration-300 ${
                    amount === preset.toString()
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Minimum deposit</span>
              <span className="font-semibold">500 {currency}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Processing time</span>
              <span className="font-semibold text-green-400">Instant</span>
            </div>
          </div>

          {/* Flutterwave Payment Button - Only show if config is ready */}
          {flutterwaveConfig ? (
            <div className="mb-6">
              <FlutterWaveButton
                {...flutterwaveConfig}
                className="w-full"
                text="Pay Now"
                style={{
                  backgroundColor: '#7C3AED',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
              <button
                type="button"
                onClick={() => setFlutterwaveConfig(null)}
                className="mt-3 w-full text-sm text-gray-400 hover:text-gray-300"
              >
                Cancel payment
              </button>
            </div>
          ) : (
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 pt-6 border-t border-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            Powered by Flutterwave • Secure payment processing
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            Test Mode: Use test card 5531 8866 5214 2950 (exp: 09/32, cvv: 564, pin: 3310)
          </p>
        </div>
      </div>
    </div>
  );
};

export default FundWalletModal;