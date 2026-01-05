import React, { useState, useEffect } from 'react';
import { Download, X, Loader, Banknote, AlertCircle } from 'lucide-react';
import { walletAPI } from '../../utils/api';

const WithdrawModal = ({ onClose, onSuccess, balance = 0, currency = 'NGN' }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pin, setPin] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: ''
  });
  const [savedBankDetails, setSavedBankDetails] = useState(null);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await walletAPI.getBankDetails();
      if (response.success && response.bank_details) {
        setSavedBankDetails(response.bank_details);
        setBankDetails(response.bank_details);
      }
    } catch (err) {
      console.error('Error fetching bank details:', err);
    }
  };

  const presetAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > balance) {
      setError('Amount exceeds your available balance');
      return;
    }

    if (parseFloat(amount) < 1000) {
      setError('Minimum withdrawal amount is 1,000');
      return;
    }

    if (!bankDetails.bank_name || !bankDetails.account_number || !bankDetails.account_name) {
      setError('Please provide all bank details');
      return;
    }

    if (!pin || pin.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await walletAPI.requestWithdrawal(
        parseFloat(amount),
        bankDetails,
        pin
      );
      
      if (response.success) {
        setSuccess(`Withdrawal request submitted successfully! Receipt: ${response.receipt_number}`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        setError(response.message || 'Withdrawal request failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (presetAmount) => {
    setAmount(presetAmount);
    setError('');
  };

  const handleBankDetailChange = (field, value) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSaveBankDetails = async () => {
    if (!bankDetails.bank_name || !bankDetails.account_number || !bankDetails.account_name) {
      setError('Please fill all bank details before saving');
      return;
    }

    try {
      const response = await walletAPI.saveBankDetails(bankDetails);
      if (response.success) {
        setSavedBankDetails(bankDetails);
        setSuccess('Bank details saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to save bank details');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-800/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-900/30 rounded-lg">
              <Download className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Withdraw Funds</h2>
              <p className="text-sm text-gray-400">Available: {balance.toLocaleString()} {currency}</p>
            </div>
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
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
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
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter withdrawal amount"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="1000"
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
                      : preset > balance
                      ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                  disabled={preset > balance}
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bank Details</h3>
              {savedBankDetails && (
                <span className="text-xs text-green-400 px-2 py-1 bg-green-900/30 rounded">
                  Saved
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={bankDetails.bank_name}
                onChange={(e) => handleBankDetailChange('bank_name', e.target.value)}
                placeholder="Bank Name (e.g., Access Bank)"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <input
                type="text"
                value={bankDetails.bank_code}
                onChange={(e) => handleBankDetailChange('bank_code', e.target.value)}
                placeholder="Bank Code (optional)"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <input
                type="text"
                value={bankDetails.account_number}
                onChange={(e) => handleBankDetailChange('account_number', e.target.value)}
                placeholder="Account Number"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <input
                type="text"
                value={bankDetails.account_name}
                onChange={(e) => handleBankDetailChange('account_name', e.target.value)}
                placeholder="Account Name"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="button"
              onClick={handleSaveBankDetails}
              className="mt-3 w-full text-sm text-purple-400 hover:text-purple-300 py-2 border border-purple-800/50 rounded-lg hover:bg-purple-900/20 transition-colors"
            >
              Save these bank details for future
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transaction PIN (4 digits)
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter your 4-digit PIN"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-center text-xl tracking-widest"
              maxLength="4"
            />
            <p className="text-xs text-gray-500 mt-2">
              Required for all withdrawal requests
            </p>
          </div>

          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p className="font-semibold">Important Information</p>
                <p className="mt-1">• Minimum withdrawal: 1,000 {currency}</p>
                <p>• Processing time: 24-48 hours</p>
                <p>• Receipt will be generated upon approval</p>
              </div>
            </div>
          </div>

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
              disabled={loading || parseFloat(amount) > balance}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            Manual approval by admin • Receipt generated upon completion
          </p>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;