import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  CreditCard, 
  ArrowUpDown, 
  History, 
  TrendingUp,
  Shield,
  Coins,
  RefreshCw,
  Download,
  Send,
  Banknote,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { walletAPI } from '../utils/api';
import TransactionHistory from '../components/wallet/TransactionHistory';
import FundWalletModal from '../components/wallet/FundWalletModal';
import WithdrawModal from '../components/wallet/WithdrawModal';
import TransferModal from '../components/wallet/TransferModal';
import { useSocket } from '../contexts/SocketContext'; // ADD THIS IMPORT

const WalletPage = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [xpTransactions, setXpTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Get socket from context
  const { socket, isConnected } = useSocket();

  // Memoized fetch functions to prevent unnecessary rerenders
  const fetchWalletData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setRefreshing(true);
      const data = await walletAPI.getBalance();
      setWalletData(data);
      return data;
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      showNotification('error', 'Failed to refresh wallet data');
    } finally {
      if (showLoading) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await walletAPI.getTransactions();
      setTransactions(data.transactions || []);
      setXpTransactions(data.xp_transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchWalletData();
      await fetchTransactions();
    };
    loadInitialData();
  }, [fetchWalletData, fetchTransactions]);

  // Setup WebSocket/Socket.io listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for balance updates from server
    socket.on('wallet:balance-updated', (data) => {
      console.log('Real-time balance update:', data);
      
      // Optimistically update the UI
      setWalletData(prev => ({
        ...prev,
        balance: data.newBalance,
        xp_points: data.newXpPoints || prev?.xp_points
      }));
      
      // Show notification
      showNotification('success', 
        data.type === 'deposit' ? `💰 +${data.amount} ${data.currency} deposited` :
        data.type === 'withdrawal' ? `📤 -${data.amount} ${data.currency} withdrawn` :
        data.type === 'transfer_received' ? `📥 Received ${data.amount} ${data.currency} from ${data.sender}` :
        `🔄 Balance updated`
      );
    });

    // Listen for new transactions
    socket.on('wallet:new-transaction', (transaction) => {
      console.log('New transaction:', transaction);
      
      // Add to beginning of transactions list
      if (transaction.currency) {
        setTransactions(prev => [transaction, ...prev]);
      } else {
        // XP transaction
        setXpTransactions(prev => [transaction, ...prev]);
      }
    });

    // Clean up listeners
    return () => {
      socket.off('wallet:balance-updated');
      socket.off('wallet:new-transaction');
    };
  }, [socket, isConnected]);

  // Notification system
  const showNotification = (type, message) => {
    const id = Date.now();
    const notification = { id, type, message };
    
    setNotifications(prev => [notification, ...prev]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Optimistic update helpers
  const optimisticBalanceUpdate = (amount, type = 'subtract', currency = 'NGN') => {
    if (!walletData) return;
    
    setWalletData(prev => {
      if (!prev) return prev;
      
      if (type === 'subtract') {
        return {
          ...prev,
          balance: parseFloat((prev.balance - amount).toFixed(2))
        };
      } else if (type === 'add') {
        return {
          ...prev,
          balance: parseFloat((prev.balance + amount).toFixed(2))
        };
      }
      return prev;
    });
  };

  const optimisticXpUpdate = (xpAmount, type = 'subtract') => {
    if (!walletData) return;
    
    setWalletData(prev => {
      if (!prev) return prev;
      
      if (type === 'subtract') {
        return {
          ...prev,
          xp_points: (prev.xp_points || 0) - xpAmount
        };
      } else if (type === 'add') {
        return {
          ...prev,
          xp_points: (prev.xp_points || 0) + xpAmount
        };
      }
      return prev;
    });
  };

  // Enhanced transaction handler
  const handleTransactionComplete = useCallback(async (type, data) => {
    // Show immediate feedback
    switch (type) {
      case 'transfer':
        showNotification('success', `✅ ${data.amount} ${data.currency} sent to ${data.recipient}`);
        optimisticBalanceUpdate(data.amount, 'subtract', data.currency);
        break;
      case 'xp_transfer':
        showNotification('success', `✅ ${data.amount} XP sent to ${data.recipient}`);
        optimisticXpUpdate(data.amount, 'subtract');
        break;
      case 'convert':
        showNotification('success', `🔄 Converted ${data.amount} ${data.currency} to ${data.xp_points} XP`);
        optimisticBalanceUpdate(data.amount, 'subtract', data.currency);
        optimisticXpUpdate(data.xp_points, 'add');
        break;
      case 'deposit':
        showNotification('success', `💰 +${data.amount} ${data.currency} added to wallet`);
        optimisticBalanceUpdate(data.amount, 'add', data.currency);
        break;
      case 'withdrawal':
        showNotification('info', `📤 Withdrawal request submitted for ${data.amount} ${data.currency}`);
        optimisticBalanceUpdate(data.amount, 'subtract', data.currency);
        break;
    }

    // Smart refetch - only fetch what's needed
    setTimeout(async () => {
      try {
        // Refresh wallet data (silently in background)
        await fetchWalletData(false);
        
        // Refresh transactions if on transactions tab
        if (activeTab === 'transactions' || activeTab === 'xp-history') {
          await fetchTransactions();
        }
      } catch (error) {
        console.error('Error refreshing after transaction:', error);
        // If refresh fails, revert optimistic update
        if (type === 'transfer' || type === 'withdrawal') {
          optimisticBalanceUpdate(data.amount, 'add', data.currency);
        } else if (type === 'xp_transfer') {
          optimisticXpUpdate(data.amount, 'add');
        } else if (type === 'convert') {
          optimisticBalanceUpdate(data.amount, 'add', data.currency);
          optimisticXpUpdate(data.xp_points, 'subtract');
        }
      }
    }, 1000);
  }, [fetchWalletData, fetchTransactions, activeTab]);

  // Manual refresh with animation
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchWalletData(false),
      fetchTransactions()
    ]);
    showNotification('info', 'Wallet data refreshed');
    setTimeout(() => setRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white">
      {/* Real-time Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-xl border shadow-lg transform transition-all duration-300 ${
              notification.type === 'success'
                ? 'bg-green-900/90 border-green-800'
                : notification.type === 'error'
                ? 'bg-red-900/90 border-red-800'
                : 'bg-blue-900/90 border-blue-800'
            } backdrop-blur-sm`}
          >
            <div className="flex items-center">
              {notification.type === 'success' && <Check className="h-5 w-5 mr-2 text-green-300" />}
              {notification.type === 'error' && <AlertCircle className="h-5 w-5 mr-2 text-red-300" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-black/50 backdrop-blur-lg border-b border-purple-900/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wallet className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold">XP Wallet</h1>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh wallet data"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Account:</span>
                <span className="font-mono bg-purple-900/50 px-3 py-1 rounded">
                  {walletData?.wallet_account_number}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Balance Cards - With subtle update animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Money Balance */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-purple-800/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {refreshing && (
              <div className="absolute inset-0 bg-purple-900/10 backdrop-blur-[1px]"></div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Banknote className="h-6 w-6 text-green-400" />
                <h2 className="text-xl font-bold">Available Balance</h2>
              </div>
              <div className="text-sm text-gray-400">{walletData?.currency}</div>
            </div>
            <div className="text-4xl font-bold mb-2 transition-all duration-300">
              {walletData?.balance.toLocaleString('en-NG', {
                style: 'currency',
                currency: walletData?.currency || 'NGN'
              })}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowFundModal(true)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>Fund Wallet</span>
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Withdraw</span>
              </button>
            </div>
          </div>

          {/* XP Points Balance */}
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-800/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {refreshing && (
              <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-[1px]"></div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Coins className="h-6 w-6 text-yellow-400" />
                <h2 className="text-xl font-bold">XP Points</h2>
              </div>
              <div className="text-sm text-gray-400">
                25 XP = 1000 {walletData?.currency}
              </div>
            </div>
            <div className="text-4xl font-bold mb-2 transition-all duration-300">
              {(walletData?.xp_points || 0).toLocaleString()} XP
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTransferModal('xp')}
                className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <Send className="h-5 w-5" />
                <span>Transfer XP</span>
              </button>
              <button
                onClick={() => setShowTransferModal('convert')}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Convert</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-900/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2 text-purple-400" />
              Quick Actions
            </h3>
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowTransferModal('money')}
              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 p-4 rounded-xl border border-purple-900/30 transition-all duration-300 transform hover:scale-[1.02] group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-900/30 rounded-lg group-hover:bg-purple-800/50">
                  <Send className="h-5 w-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Transfer Money</div>
                  <div className="text-sm text-gray-400">Send to another user</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowTransferModal('xp')}
              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 p-4 rounded-xl border border-blue-900/30 transition-all duration-300 transform hover:scale-[1.02] group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-900/30 rounded-lg group-hover:bg-blue-800/50">
                  <Coins className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Transfer XP</div>
                  <div className="text-sm text-gray-400">Send XP to friends</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowTransferModal('convert')}
              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 p-4 rounded-xl border border-green-900/30 transition-all duration-300 transform hover:scale-[1.02] group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-900/30 rounded-lg group-hover:bg-green-800/50">
                  <RefreshCw className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Convert</div>
                  <div className="text-sm text-gray-400">Money ↔ XP Points</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 p-4 rounded-xl border border-red-900/30 transition-all duration-300 transform hover:scale-[1.02] group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-900/30 rounded-lg group-hover:bg-red-800/50">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Security</div>
                  <div className="text-sm text-gray-400">PIN & 2FA Settings</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {['overview', 'transactions', 'xp-history', 'security'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'transactions' && 'Money Transactions'}
              {tab === 'xp-history' && 'XP History'}
              {tab === 'security' && 'Security'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-900/30">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                Recent Activity
              </h3>
              <TransactionHistory 
                transactions={transactions.slice(0, 5)} 
                xpTransactions={xpTransactions.slice(0, 5)}
                showAll={false}
              />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  View all transactions →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <TransactionHistory 
              transactions={transactions} 
              showAll={true}
            />
          )}

          {activeTab === 'xp-history' && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Coins className="h-5 w-5 mr-2 text-yellow-400" />
                XP Points History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left">Type</th>
                      <th className="py-3 px-4 text-left">Amount</th>
                      <th className="py-3 px-4 text-left">Description</th>
                      <th className="py-3 px-4 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {xpTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.type.includes('earned') || tx.type.includes('in') 
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {tx.type.includes('out') || tx.type.includes('spent') ? '-' : '+'}
                          {tx.amount} XP
                        </td>
                        <td className="py-3 px-4 text-gray-300">{tx.description}</td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 className="text-lg font-bold mb-6">Security Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border border-purple-900/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-purple-400" />
                      <h4 className="font-bold">Transaction PIN</h4>
                    </div>
                    <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm">
                      {walletData?.has_pin ? 'Set' : 'Not Set'}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Required for all transactions and withdrawals
                  </p>
                  <button
                    onClick={() => window.location.href = '/settings?tab=security'}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    Set/Change PIN
                  </button>
                </div>

                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border border-blue-900/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-blue-400" />
                      <h4 className="font-bold">Two-Factor Authentication</h4>
                    </div>
                    <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm">
                      Optional
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Add extra security to your account
                  </p>
                  <button
                    onClick={() => window.location.href = '/settings?tab=security'}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals - Updated with proper callback handlers */}
      {showFundModal && (
        <FundWalletModal
          onClose={() => setShowFundModal(false)}
          onSuccess={() => handleTransactionComplete('deposit', {
            amount: 0, // Will be filled by modal
            currency: walletData?.currency
          })}
          currency={walletData?.currency}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={(data) => handleTransactionComplete('withdrawal', data)}
          balance={walletData?.balance}
          currency={walletData?.currency}
        />
      )}

      {showTransferModal && (
        <TransferModal
          type={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={(data) => {
            if (showTransferModal === 'money') {
              handleTransactionComplete('transfer', data);
            } else if (showTransferModal === 'xp') {
              handleTransactionComplete('xp_transfer', data);
            } else if (showTransferModal === 'convert') {
              handleTransactionComplete('convert', data);
            }
          }}
          walletAccount={walletData?.wallet_account_number}
          balance={walletData?.balance}
          xpPoints={walletData?.xp_points}
          currency={walletData?.currency}
        />
      )}
    </div>
  );
};

export default WalletPage;