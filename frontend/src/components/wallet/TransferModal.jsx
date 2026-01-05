import React, { useState } from 'react';
import { Send, X, Loader, Search, Coins, Banknote, AlertCircle, Check, User } from 'lucide-react';
import { walletAPI } from '../../utils/api';

const TransferModal = ({ type, onClose, onSuccess, walletAccount, balance = 0, xpPoints = 0, currency = 'NGN' }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recipientWallet, setRecipientWallet] = useState('');
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [description, setDescription] = useState('');

  const isMoneyTransfer = type === 'money';
  const isXpTransfer = type === 'xp';
  const isConvert = type === 'convert';

  // Step 1: Find recipient by wallet number
  const handleFindRecipient = async () => {
    if (!recipientWallet || recipientWallet.length < 3) {
      setError('Please enter a valid wallet number (e.g., XP00000002)');
      return;
    }

    if (recipientWallet === walletAccount) {
      setError('You cannot transfer to yourself');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For now, we'll simulate finding a user
      // In a real implementation, you would call an API to verify the wallet
      console.log('Looking up wallet:', recipientWallet);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - In production, replace with real API call
      // Example: const response = await walletAPI.verifyWallet(recipientWallet);
      const mockRecipient = {
        id: parseInt(recipientWallet.replace('XP', '')) || 2,
        username: `User_${recipientWallet.slice(-4)}`,
        wallet_account_number: recipientWallet,
        exists: true
      };
      
      setRecipientInfo(mockRecipient);
      setStep(2);
      setSuccess(`Found recipient: ${mockRecipient.username}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError('Could not find user with this wallet number. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== TRANSFER SUBMIT ===');
    console.log('Type:', type);
    console.log('Recipient Wallet:', recipientWallet);
    console.log('Amount:', amount);
    console.log('PIN length:', pin?.length);

    if (isConvert) {
      // Handle conversion (this was working)
      if (!amount || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (parseFloat(amount) > balance) {
        setError('Amount exceeds your available balance');
        return;
      }

      if (!pin || pin.length !== 4) {
        setError('Please enter your 4-digit PIN');
        return;
      }

      setLoading(true);
      try {
        const response = await walletAPI.convertToXp(parseFloat(amount), pin);
        if (response.success) {
          setSuccess(`Converted ${amount} ${currency} to ${response.xp_points} XP points!`);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        } else {
          setError(response.message || 'Conversion failed');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For transfers
    if (!recipientWallet) {
      setError('Please enter recipient wallet number');
      return;
    }

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (isMoneyTransfer && parseFloat(amount) > balance) {
      setError(`Amount exceeds your available balance (${balance} ${currency})`);
      return;
    }

    if (isXpTransfer && parseInt(amount) > xpPoints) {
      setError(`Amount exceeds your available XP points (${xpPoints} XP)`);
      return;
    }

    if (!pin || pin.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);
    
    try {
      let response;
      
      if (isMoneyTransfer) {
        console.log('Calling transferFunds with:', {
          recipientWallet,
          amount: parseFloat(amount),
          pin: '****'
        });
        
        response = await walletAPI.transferFunds(
          recipientWallet,
          parseFloat(amount),
          pin,
          description
        );
      } else if (isXpTransfer) {
        console.log('Calling transferXp with:', {
          recipientWallet,
          amount: parseInt(amount),
          pin: '****'
        });
        
        response = await walletAPI.transferXp(
          recipientWallet,
          parseInt(amount),
          pin,
          description
        );
      }

      console.log('Transfer response:', response);

      if (response?.success) {
        const recipientName = recipientInfo?.username || 'the recipient';
        setSuccess(`Transfer successful! ${amount} ${isMoneyTransfer ? currency : 'XP'} sent to ${recipientName}`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(response?.message || 'Transfer failed. Please check details and try again.');
      }
    } catch (err) {
      console.error('Transfer error details:', err);
      setError(err.message || 'An error occurred during transfer.');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    if (isMoneyTransfer) return 'Transfer Money';
    if (isXpTransfer) return 'Transfer XP Points';
    if (isConvert) return 'Convert Money to XP';
    return 'Transfer';
  };

  const getMaxAmount = () => {
    if (isMoneyTransfer) return balance;
    if (isXpTransfer) return xpPoints;
    if (isConvert) return balance;
    return 0;
  };

  // Sample wallet numbers for testing (from your database)
  const sampleWallets = ['XP00000002', 'XP00000003', 'XP00000004', 'XP00000005'];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-800/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isMoneyTransfer ? 'bg-purple-900/30' :
              isXpTransfer ? 'bg-yellow-900/30' :
              'bg-green-900/30'
            }`}>
              {isConvert ? (
                <Coins className="h-6 w-6 text-green-400" />
              ) : (
                <Send className={`h-6 w-6 ${
                  isMoneyTransfer ? 'text-purple-400' : 'text-yellow-400'
                }`} />
              )}
            </div>
            <h2 className="text-xl font-bold">{getModalTitle()}</h2>
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

          {/* Step 1: Enter Recipient Wallet */}
          {!isConvert && step === 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Wallet Number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={recipientWallet}
                  onChange={(e) => {
                    setRecipientWallet(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="Enter wallet number (e.g., XP00000002)"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                />
              </div>
              
              <button
                type="button"
                onClick={handleFindRecipient}
                disabled={loading || !recipientWallet}
                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Verify & Continue
                  </>
                )}
              </button>

              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Sample wallets for testing:</p>
                <div className="grid grid-cols-2 gap-2">
                  {sampleWallets.map((wallet) => (
                    <button
                      key={wallet}
                      type="button"
                      onClick={() => {
                        setRecipientWallet(wallet);
                        setError('');
                      }}
                      className="text-sm p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg font-mono text-gray-300 hover:text-white transition-colors"
                    >
                      {wallet}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Transfer Details */}
          {(isConvert || step === 2) && (
            <>
              {!isConvert && recipientInfo && (
                <div className="mb-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-900/30 rounded-lg">
                        <User className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold">{recipientInfo.username}</div>
                        <div className="text-sm text-gray-400 font-mono">{recipientInfo.wallet_account_number}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setRecipientInfo(null);
                      }}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    {isConvert ? 'Amount to Convert' : 'Amount to Send'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(getMaxAmount())}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Max: {getMaxAmount().toLocaleString()} {isMoneyTransfer ? currency : 'XP'}
                  </button>
                </div>
                <div className="relative">
                  {isConvert || isMoneyTransfer ? (
                    <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  ) : (
                    <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  )}
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      const max = getMaxAmount();
                      const value = e.target.value;
                      setAmount(value > max ? max : value);
                    }}
                    placeholder={`Enter ${isConvert ? currency : isMoneyTransfer ? currency : 'XP'} amount`}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    max={getMaxAmount()}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {isConvert || isMoneyTransfer ? currency : 'XP'}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Available: {getMaxAmount().toLocaleString()} {isMoneyTransfer ? currency : 'XP'}
                </p>
              </div>

              {isConvert && (
                <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Conversion Rate</span>
                    <span className="font-semibold">25 XP = 1000 {currency}</span>
                  </div>
                  <div className="mt-2 text-center text-lg font-bold text-blue-300">
                    ≈ {amount ? Math.floor((amount / 1000) * 25) : 0} XP
                  </div>
                </div>
              )}

              {!isConvert && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a note for this transfer"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength="100"
                  />
                </div>
              )}

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
                <p className="text-xs text-gray-500 mt-2">Required to authorize this transaction</p>
              </div>
            </>
          )}

          <div className="flex space-x-3">
            {step === 2 && !isConvert ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={loading}
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || (!isConvert && step === 1)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                isConvert 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  : isMoneyTransfer
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
              } text-white`}
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : isConvert ? (
                'Convert Now'
              ) : step === 1 ? (
                'Continue'
              ) : (
                'Confirm Transfer'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            {isConvert 
              ? `Conversion rate: 25 XP = 1000 ${currency}` 
              : 'All transfers require transaction PIN verification'}
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            {!isConvert && 'Use sample wallets (XP00000002, XP00000003) for testing'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;