import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

const WithdrawalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionType, setActionType] = useState('');
  const [notes, setNotes] = useState('');
  
  // State for all data sections
  const [withdrawal, setWithdrawal] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [approvalHistory, setApprovalHistory] = useState([]);

  useEffect(() => {
    fetchWithdrawalDetails();
  }, [id]);

  const fetchWithdrawalDetails = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getWithdrawalDetails(id);
      
      // Assuming the API returns structured data
      const data = response.data;
      
      // Set withdrawal info (SECTION 1)
      setWithdrawal({
        receipt_number: data.receipt_number || `XPR-${Date.now()}-${id}`,
        amount: data.amount || 0,
        currency: data.currency || 'NGN',
        status: data.status || 'pending',
        created_at: data.created_at || new Date().toISOString(),
        bank_name: data.bank_name || 'Not specified',
        account_number: data.account_number || 'Not specified',
        account_name: data.account_name || 'Not specified'
      });
      
      // Set user info (SECTION 2)
      setUserInfo({
        username: data.username || 'Unknown',
        email: data.email || 'No email',
        wallet_account_number: data.wallet_account_number || 'XP00000000',
        user_id: data.user_id || id
      });
      
      // Set transaction details (SECTION 3)
      setTransaction({
        transaction_id: data.transaction_id || 0,
        transaction_reference: data.transaction_reference || `XTX-${Date.now()}-${id}`,
        transaction_status: data.transaction_status || 'pending_approval'
      });
      
      // Set approval history (SECTION 4)
      setApprovalHistory(data.approval_history || []);
      
      setError('');
    } catch (err) {
      console.error('Error fetching withdrawal details:', err);
      setError('Failed to load withdrawal details. Please try again.');
      
      // Load mock data for development (remove in production)
      if (err.message.includes('404') || err.message.includes('Network')) {
        loadMockData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development (remove in production)
  const loadMockData = () => {
    setWithdrawal({
      receipt_number: `XPR-${Date.now()}-${id}`,
      amount: 5000.00,
      currency: 'NGN',
      status: 'pending',
      created_at: new Date().toISOString(),
      bank_name: 'Access Bank',
      account_number: '0031234567',
      account_name: 'John Doe'
    });
    
    setUserInfo({
      username: 'player123',
      email: 'player@email.com',
      wallet_account_number: 'XP00000014',
      user_id: 14
    });
    
    setTransaction({
      transaction_id: 456,
      transaction_reference: `XTX-${Date.now()}-abc123`,
      transaction_status: 'pending_approval'
    });
    
    setApprovalHistory([
      {
        admin_username: 'admin',
        action: 'reviewed',
        notes: 'Under review',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ]);
  };

  const handleAction = async (action) => {
    if (!action) return;
    
    try {
      setProcessing(true);
      setActionType(action);
      
      await adminAPI.processWithdrawal(id, action, notes);
      
      // Refresh data
      await fetchWithdrawalDetails();
      
      // Show success message
      alert(`Withdrawal ${action}d successfully!`);
      
      // Clear notes
      setNotes('');
      
    } catch (err) {
      setError(`Failed to ${action} withdrawal: ${err.message}`);
      console.error('Action error:', err);
    } finally {
      setProcessing(false);
      setActionType('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-700';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-900/30 text-red-400 border-red-700';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700';
      case 'processing':
        return 'bg-blue-900/30 text-blue-400 border-blue-700';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
            <p className="mt-4 text-gray-300 text-lg">Loading withdrawal details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/withdrawals')}
            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Withdrawals
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Withdrawal Details
              </h1>
              <p className="text-gray-400 mt-1">Receipt: {withdrawal?.receipt_number}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg border ${getStatusBadgeClass(withdrawal?.status)} font-bold`}>
                {withdrawal?.status?.toUpperCase()}
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Withdrawal & User Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECTION 1: WITHDRAWAL INFORMATION */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Withdrawal Information</h2>
                <div className="text-2xl font-bold text-cyan-400">
                  {withdrawal?.amount?.toLocaleString()} {withdrawal?.currency}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-400 text-sm">Receipt Number</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg font-mono">
                    {withdrawal?.receipt_number}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Request Date</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg">
                    {formatDate(withdrawal?.created_at)}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Bank Name</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg">
                    {withdrawal?.bank_name}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Account Number</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg font-mono">
                    {withdrawal?.account_number}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Account Name</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg">
                    {withdrawal?.account_name}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Currency</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg">
                    {withdrawal?.currency}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: USER INFORMATION */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-6">User Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-400 text-sm">User ID</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg">
                    {userInfo?.user_id}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Username</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg">
                    {userInfo?.username}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Email Address</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg">
                    {userInfo?.email}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Wallet Account</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg font-mono text-cyan-400">
                    {userInfo?.wallet_account_number}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <button
                    onClick={() => navigate(`/admin/users/${userInfo?.user_id}`)}
                    className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    View Full User Profile
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 4: APPROVAL HISTORY */}
            {approvalHistory.length > 0 && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-6">Approval History</h2>
                
                <div className="space-y-4">
                  {approvalHistory.map((record, index) => (
                    <div key={index} className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            record.action === 'approved' ? 'bg-green-900/30 text-green-400' :
                            record.action === 'rejected' ? 'bg-red-900/30 text-red-400' :
                            'bg-gray-800 text-gray-300'
                          }`}>
                            {record.action?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{record.admin_username || 'System'}</p>
                            <p className="text-sm text-gray-400">{record.notes || 'No notes provided'}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatDate(record.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Transaction */}
          <div className="space-y-6">
            {/* SECTION 5: ACTION BUTTONS */}
            {withdrawal?.status === 'pending' && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-6">Process Withdrawal</h2>
                
                <div className="space-y-4">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={processing && actionType === 'approve'}
                    className="w-full p-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    {processing && actionType === 'approve' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve & Process Payment
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={processing && actionType === 'reject'}
                    className="w-full p-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:opacity-50 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    {processing && actionType === 'reject' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject & Refund Money
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleAction('completed')}
                    disabled={processing && actionType === 'completed'}
                    className="w-full p-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    {processing && actionType === 'completed' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark as Completed
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-6">
                  <label className="text-gray-400 text-sm mb-2 block">Add Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes about this action..."
                    className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">Notes will be saved to approval history.</p>
                </div>
              </div>
            )}

            {/* SECTION 3: TRANSACTION DETAILS */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-6">Transaction Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Transaction ID</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg">
                    #{transaction?.transaction_id}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Reference</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg font-mono break-all">
                    {transaction?.transaction_reference}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Transaction Status</label>
                  <div className={`mt-1 p-3 rounded-lg font-medium ${getStatusBadgeClass(transaction?.transaction_status)}`}>
                    {transaction?.transaction_status?.replace('_', ' ')?.toUpperCase()}
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Amount</label>
                  <div className="mt-1 p-3 bg-gray-800/50 rounded-lg text-xl font-bold text-cyan-400">
                    {withdrawal?.amount?.toLocaleString()} {withdrawal?.currency}
                  </div>
                </div>
                
                <button
                  onClick={() => console.log('View full transaction')}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Transaction Receipt
                </button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigator.clipboard.writeText(withdrawal?.receipt_number)}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-between"
                >
                  <span className="text-gray-300">Copy Receipt Number</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => navigator.clipboard.writeText(userInfo?.email)}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-between"
                >
                  <span className="text-gray-300">Copy User Email</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => window.open(`mailto:${userInfo?.email}?subject=Withdrawal ${withdrawal?.receipt_number}`)}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-between"
                >
                  <span className="text-gray-300">Email User</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalDetails;