import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminAPI } from '../../utils/api';
import {
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Banknote,
  User,
  Calendar
} from 'lucide-react';

const WithdrawalQueue = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, withdrawal: null, action: '' });
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();

  const fetchWithdrawals = async (page = 1) => {
    setLoading(true);
    try {
      const response = await adminAPI.getWithdrawals(filterStatus, page, pagination.limit);
      if (response.success) {
        setWithdrawals(response.withdrawals);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filterStatus]);

  const handleAction = async (action) => {
    if (!actionModal.withdrawal) return;

    setProcessingId(actionModal.withdrawal.id);
    try {
      const response = await adminAPI.processWithdrawal(
        actionModal.withdrawal.id,
        action,
        notes
      );

      if (response.success) {
        // Update local state
        setWithdrawals(prev =>
          prev.filter(w => w.id !== actionModal.withdrawal.id)
        );
        
        // Show success message (you can add a toast notification here)
        alert(`Withdrawal ${action}d successfully!`);
        
        // Close modal and reset
        setActionModal({ open: false, withdrawal: null, action: '' });
        setNotes('');
        
        // Refresh data if needed
        if (withdrawals.length <= 1) {
          fetchWithdrawals();
        }
      }
    } catch (error) {
      console.error('Failed to process withdrawal:', error);
      alert(`Failed to ${action} withdrawal: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/admin/withdrawals/${id}`);
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-900/30 text-yellow-300', icon: Clock },
      processing: { color: 'bg-blue-900/30 text-blue-300', icon: Clock },
      approved: { color: 'bg-green-900/30 text-green-300', icon: CheckCircle },
      rejected: { color: 'bg-red-900/30 text-red-300', icon: XCircle },
      completed: { color: 'bg-purple-900/30 text-purple-300', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs flex items-center ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && withdrawals.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading withdrawals...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Download className="h-6 w-6 mr-2 text-yellow-400" />
            Withdrawal Queue
          </h1>
          <p className="text-gray-400">Review and process withdrawal requests</p>
        </div>
        <button
          onClick={() => fetchWithdrawals(pagination.page)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Status
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'processing', 'approved', 'rejected', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status === 'all' ? '' : status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filterStatus === (status === 'all' ? '' : status)
                      ? 'bg-purple-900/50 text-white border border-purple-700'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username, email, or receipt"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quick Stats
            </label>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {withdrawals.filter(w => w.status === 'processing').length}
                </div>
                <div className="text-xs text-gray-400">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {withdrawals.filter(w => w.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">User</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Amount</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Bank Details</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length > 0 ? (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold">{withdrawal.username}</div>
                        <div className="text-sm text-gray-400">{withdrawal.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {withdrawal.wallet_account_number}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Banknote className="h-4 w-4 text-green-400 mr-2" />
                        <div>
                          <div className="font-bold text-lg">
                            {formatCurrency(withdrawal.amount, withdrawal.currency)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Receipt: {withdrawal.receipt_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <div className="font-medium">{withdrawal.bank_name}</div>
                        <div className="text-gray-400">{withdrawal.account_number}</div>
                        <div className="text-gray-400">{withdrawal.account_name}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <div>{new Date(withdrawal.created_at).toLocaleDateString()}</div>
                        <div className="text-gray-400">
                          {new Date(withdrawal.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(withdrawal.id)}
                          className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setActionModal({
                                open: true,
                                withdrawal,
                                action: 'approve'
                              })}
                              disabled={processingId === withdrawal.id}
                              className="p-2 bg-green-900/30 hover:bg-green-800/50 text-green-300 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => setActionModal({
                                open: true,
                                withdrawal,
                                action: 'reject'
                              })}
                              disabled={processingId === withdrawal.id}
                              className="p-2 bg-red-900/30 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {withdrawal.status === 'processing' && (
                          <button
                            onClick={() => setActionModal({
                              open: true,
                              withdrawal,
                              action: 'completed'
                            })}
                            disabled={processingId === withdrawal.id}
                            className="p-2 bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <Download className="h-12 w-12 mx-auto mb-4 text-gray-500 opacity-30" />
                    <p className="text-gray-500">No withdrawal requests found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {filterStatus ? `No ${filterStatus} withdrawals` : 'Try changing your filters'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-gray-700/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} withdrawals
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchWithdrawals(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchWithdrawals(pageNum)}
                        className={`w-8 h-8 rounded-lg ${
                          pagination.page === pageNum
                            ? 'bg-purple-900/50 text-white'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => fetchWithdrawals(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-800/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  actionModal.action === 'approve' ? 'bg-green-900/30' :
                  actionModal.action === 'reject' ? 'bg-red-900/30' :
                  'bg-purple-900/30'
                }`}>
                  {actionModal.action === 'approve' ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : actionModal.action === 'reject' ? (
                    <XCircle className="h-6 w-6 text-red-400" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-purple-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {actionModal.action === 'approve' ? 'Approve Withdrawal' :
                     actionModal.action === 'reject' ? 'Reject Withdrawal' :
                     'Mark as Completed'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {formatCurrency(actionModal.withdrawal.amount, actionModal.withdrawal.currency)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModal({ open: false, withdrawal: null, action: '' })}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-800/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{actionModal.withdrawal.username}</div>
                  <div className="text-sm text-gray-400">{actionModal.withdrawal.email}</div>
                </div>
                <div className="text-sm text-gray-400">
                  Receipt: {actionModal.withdrawal.receipt_number}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              {actionModal.action === 'reject' && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                    <div className="text-sm text-red-300">
                      <p className="font-semibold">Warning</p>
                      <p className="mt-1">Rejecting will refund the amount back to the user's wallet.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setActionModal({ open: false, withdrawal: null, action: '' })}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(actionModal.action)}
                disabled={processingId === actionModal.withdrawal.id}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center ${
                  actionModal.action === 'approve'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : actionModal.action === 'reject'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                } text-white disabled:opacity-50`}
              >
                {processingId === actionModal.withdrawal.id ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {actionModal.action === 'approve' ? 'Approve Withdrawal' :
                     actionModal.action === 'reject' ? 'Reject Withdrawal' :
                     'Mark as Completed'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default WithdrawalQueue;