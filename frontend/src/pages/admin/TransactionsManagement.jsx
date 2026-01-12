import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, CheckCircle, XCircle, Clock,
  DollarSign, Users, TrendingUp, RefreshCw, Download,
  ExternalLink, AlertCircle
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const TransactionsManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    todayCount: 0,
    todayAmount: 0
  });

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [currentPage, filterType, filterStatus, searchTerm]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTransactions(
        filterType, 
        filterStatus, 
        currentPage, 
        20,
        searchTerm
      );
      setTransactions(response.transactions || response.data || []);
      setTotalPages(response.pagination?.totalPages || response.totalPages || 1);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getTransactionStats('today');
      if (response.stats) {
        setStats({
          total: response.stats.total || 0,
          totalAmount: response.stats.totalAmount || 0,
          pending: response.stats.pending || 0,
          completed: response.stats.completed || 0,
          failed: response.stats.failed || 0,
          todayCount: response.stats.todayCount || 0,
          todayAmount: response.stats.todayAmount || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        total: 0,
        totalAmount: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        todayCount: 0,
        todayAmount: 0
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadTransactions();
  };

  const handleStatusUpdate = async (id, status, notes = '') => {
    try {
      const response = await adminAPI.updateTransactionStatus(id, status, notes);
      if (response?.success) {
        loadTransactions();
        loadStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update transaction status');
    }
  };

  const handleRefund = async (id) => {
    if (window.confirm('Are you sure you want to refund this transaction?')) {
      try {
        const reason = prompt('Enter refund reason (optional):', 'Admin refund');
        const response = await adminAPI.refundTransaction(id, reason || 'Admin refund');
        if (response?.success) {
          alert('Refund processed successfully');
          loadTransactions();
          loadStats();
        }
      } catch (error) {
        console.error('Error refunding transaction:', error);
        alert('Failed to process refund');
      }
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    const headers = ['ID', 'User ID', 'Username', 'Amount', 'Currency', 'Type', 'Status', 'Reference', 'Description', 'Date'];
    const csvData = transactions.map(t => [
      t.id,
      t.user_id,
      t.username || 'N/A',
      t.amount,
      t.currency,
      t.type,
      t.status,
      t.reference,
      t.description || '',
      new Date(t.created_at).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'pending_approval': 'bg-blue-100 text-blue-800',
      'approved': 'bg-purple-100 text-purple-800'
    };
    
    const icons = {
      'completed': <CheckCircle className="w-3 h-3 mr-1" />,
      'pending': <Clock className="w-3 h-3 mr-1" />,
      'failed': <XCircle className="w-3 h-3 mr-1" />,
      'pending_approval': <AlertCircle className="w-3 h-3 mr-1" />,
      'approved': <CheckCircle className="w-3 h-3 mr-1" />
    };
    
    const statusText = status ? status.replace('_', ' ') : 'unknown';
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]}
        {statusText}
      </span>
    );
  };

  const TypeBadge = ({ type }) => {
    const colors = {
      'deposit': 'bg-blue-100 text-blue-800',
      'withdrawal': 'bg-green-100 text-green-800',
      'tournament_entry': 'bg-purple-100 text-purple-800',
      'winning': 'bg-yellow-100 text-yellow-800',
      'refund': 'bg-orange-100 text-orange-800',
      'transfer': 'bg-indigo-100 text-indigo-800'
    };
    
    const typeText = type ? type.replace('_', ' ') : 'unknown';
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {typeText}
      </span>
    );
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return '0.00';
    const numAmount = parseFloat(amount);
    const formatted = Math.abs(numAmount).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₦';
    
    return `${numAmount >= 0 ? '+' : '-'}${symbol}${formatted}`;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Transactions Management</h1>
        <p className="text-gray-300">View and manage all financial transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Transactions</p>
              <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/20 mr-3">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Amount</p>
              <p className="text-2xl font-bold text-white">
                ₦{stats.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500/20 mr-3">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Pending</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/20 mr-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Completed</p>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500/10 to-red-600/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-500/20 mr-3">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Failed</p>
              <p className="text-2xl font-bold text-white">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Today's Transactions</p>
              <p className="text-2xl font-bold text-white">{stats.todayCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500/10 to-indigo-600/20 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-indigo-500/20 mr-3">
              <DollarSign className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Today's Amount</p>
              <p className="text-2xl font-bold text-white">
                ₦{stats.todayAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50">
        <form onSubmit={handleSearch}>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by reference, user ID, username, or email..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Search
              </button>
              <button
                type="button"
                onClick={exportToCSV}
                disabled={transactions.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('');
                  setFilterStatus('');
                  setCurrentPage(1);
                  loadTransactions();
                }}
                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Type Filter</label>
              <select
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="tournament_entry">Tournament Entry</option>
                <option value="winning">Winning</option>
                <option value="refund">Refund</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Status Filter</label>
              <select
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID & Reference</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-gray-400">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-gray-500 mb-2" />
                      <p className="text-gray-400 text-lg font-medium">No transactions found</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {searchTerm || filterType || filterStatus 
                          ? 'Try adjusting your search or filters' 
                          : 'No transactions in the system yet'}
                      </p>
                      {(searchTerm || filterType || filterStatus) && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setFilterType('');
                            setFilterStatus('');
                            setCurrentPage(1);
                            loadTransactions();
                          }}
                          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-white">#{transaction.id}</div>
                      <div className="text-xs text-gray-400 truncate max-w-xs" title={transaction.reference}>
                        {transaction.reference}
                      </div>
                      {transaction.external_reference && (
                        <div className="text-xs text-gray-500 mt-1">
                          Ext: {transaction.external_reference}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-white">ID: {transaction.user_id}</div>
                      {transaction.username && (
                        <div className="text-sm font-medium text-blue-300">@{transaction.username}</div>
                      )}
                      {transaction.email && (
                        <div className="text-xs text-gray-400 truncate max-w-xs">{transaction.email}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`text-sm font-medium ${parseFloat(transaction.amount) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </div>
                      {transaction.description && (
                        <div className="text-xs text-gray-400 truncate max-w-xs mt-1" title={transaction.description}>
                          {transaction.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <TypeBadge type={transaction.type} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-400">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      {transaction.completed_at && transaction.status === 'completed' && (
                        <div className="text-xs text-green-500 mt-1">
                          Completed: {new Date(transaction.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {transaction.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(transaction.id, 'completed', 'Approved by admin')}
                              className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(transaction.id, 'failed', 'Rejected by admin')}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {transaction.type === 'deposit' && transaction.status === 'completed' && (
                          <button
                            onClick={() => handleRefund(transaction.id)}
                            className="p-1.5 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 rounded-lg transition-colors"
                            title="Refund"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(transaction.status === 'pending_approval' || transaction.status === 'approved') && (
                          <button
                            onClick={() => handleStatusUpdate(transaction.id, 'completed', 'Finalized by admin')}
                            className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors"
                            title="Finalize"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800/50 bg-gray-800/30">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages} • {transactions.length} transactions
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Transaction Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Transaction ID</label>
                    <div className="text-white font-mono">#{selectedTransaction.id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Reference</label>
                    <div className="text-white font-mono text-sm break-all">{selectedTransaction.reference}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">User Details</label>
                    <div className="text-white">
                      <div>ID: {selectedTransaction.user_id}</div>
                      {selectedTransaction.username && (
                        <div>Username: @{selectedTransaction.username}</div>
                      )}
                      {selectedTransaction.email && (
                        <div className="text-sm text-gray-400">{selectedTransaction.email}</div>
                      )}
                      {selectedTransaction.wallet_account_number && (
                        <div className="text-sm text-gray-400">Wallet: {selectedTransaction.wallet_account_number}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                    <div className={`text-xl font-bold ${parseFloat(selectedTransaction.amount) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                    <TypeBadge type={selectedTransaction.type} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <StatusBadge status={selectedTransaction.status} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
                    <div className="text-white">
                      {new Date(selectedTransaction.created_at).toLocaleString()}
                    </div>
                  </div>
                  {selectedTransaction.completed_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Completed At</label>
                      <div className="text-white">
                        {new Date(selectedTransaction.completed_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {selectedTransaction.updated_at && selectedTransaction.updated_at !== selectedTransaction.created_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Last Updated</label>
                      <div className="text-white">
                        {new Date(selectedTransaction.updated_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedTransaction.description && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                  <p className="text-gray-300">{selectedTransaction.description}</p>
                </div>
              )}

              {selectedTransaction.external_reference && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">External Reference</h4>
                  <p className="text-gray-300 font-mono text-sm break-all">{selectedTransaction.external_reference}</p>
                </div>
              )}

              {selectedTransaction.withdrawal_details && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">Withdrawal Details</h4>
                  <div className="text-gray-300 text-sm bg-gray-800/50 p-3 rounded-lg overflow-x-auto">
                    {(() => {
                      try {
                        const details = JSON.parse(selectedTransaction.withdrawal_details);
                        return <pre>{JSON.stringify(details, null, 2)}</pre>;
                      } catch {
                        return <p>{selectedTransaction.withdrawal_details}</p>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {selectedTransaction.account_details && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">Account Details</h4>
                  <div className="text-gray-300 text-sm bg-gray-800/50 p-3 rounded-lg overflow-x-auto">
                    {(() => {
                      try {
                        const details = JSON.parse(selectedTransaction.account_details);
                        return <pre>{JSON.stringify(details, null, 2)}</pre>;
                      } catch {
                        return <p>{selectedTransaction.account_details}</p>;
                      }
                    })()}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-end space-x-3">
                  {selectedTransaction.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedTransaction.id, 'completed', 'Approved by admin');
                          setShowDetailsModal(false);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedTransaction.id, 'failed', 'Rejected by admin');
                          setShowDetailsModal(false);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {selectedTransaction.status === 'pending_approval' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedTransaction.id, 'approved', 'Approved by admin');
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700"
                    >
                      Approve
                    </button>
                  )}
                  
                  {selectedTransaction.type === 'deposit' && selectedTransaction.status === 'completed' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setTimeout(() => handleRefund(selectedTransaction.id), 300);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700"
                    >
                      Refund
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsManagement;