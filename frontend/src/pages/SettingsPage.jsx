// frontend/src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Smartphone, 
  CreditCard,
  Bell,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Key,
  Smartphone as Device,
  Download,
  QrCode,
  Save,
  AlertCircle,
  Loader
} from 'lucide-react';
import { walletAPI } from '../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const location = useLocation();
  const navigate = useNavigate();

  // Transaction PIN state
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false
  });

  // Bank details state
  const [bankData, setBankData] = useState({
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: '',
    is_default: true
  });

  // Security preferences state
  const [securityPrefs, setSecurityPrefs] = useState({
    login_alerts: true,
    session_timeout: 30,
    require_pin_for_transactions: true
  });

  // Load saved bank details on mount
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) setActiveTab(tab);
    
    fetchBankDetails();
  }, [location]);

  const fetchBankDetails = async () => {
    try {
      const response = await walletAPI.getBankDetails();
      if (response.success && response.bank_details) {
        setBankData(response.bank_details);
      }
    } catch (err) {
      console.error('Error fetching bank details:', err);
    }
  };

  const handlePinChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (pinData.newPin !== pinData.confirmPin) {
      setMessage({ type: 'error', text: 'New PINs do not match' });
      setLoading(false);
      return;
    }

    if (pinData.newPin.length !== 4 || !/^\d+$/.test(pinData.newPin)) {
      setMessage({ type: 'error', text: 'PIN must be 4 digits' });
      setLoading(false);
      return;
    }

    try {
      const response = await walletAPI.setTransactionPin(pinData.newPin, pinData.confirmPin);
      if (response.success) {
        setMessage({ type: 'success', text: 'Transaction PIN updated successfully!' });
        setPinData({ currentPin: '', newPin: '', confirmPin: '', showCurrent: false, showNew: false, showConfirm: false });
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update PIN' });
    } finally {
      setLoading(false);
    }
  };

  const handleBankDetailsSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!bankData.bank_name || !bankData.account_number || !bankData.account_name) {
      setMessage({ type: 'error', text: 'Please fill all required bank details' });
      setLoading(false);
      return;
    }

    try {
      const response = await walletAPI.saveBankDetails(bankData);
      if (response.success) {
        setMessage({ type: 'success', text: 'Bank details saved successfully!' });
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save bank details' });
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityPrefsSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement API for security preferences
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Security preferences updated!' });
        setLoading(false);
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
      setLoading(false);
    }
  };

  const TabButton = ({ tab, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
        activeTab === tab
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-semibold">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-lg border-b border-purple-900/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            <button
              onClick={() => navigate('/wallet')}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              Back to Wallet
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-purple-900/30">
              <nav className="space-y-2">
                <TabButton tab="security" icon={Shield} label="Security" />
                <TabButton tab="bank" icon={CreditCard} label="Bank Details" />
                <TabButton tab="preferences" icon={Bell} label="Preferences" />
                <TabButton tab="devices" icon={Device} label="Devices" />
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-900/30">
              {message.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center ${
                  message.type === 'success' 
                    ? 'bg-green-900/30 border border-green-800/50 text-green-300'
                    : 'bg-red-900/30 border border-red-800/50 text-red-300'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-3" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-3" />
                  )}
                  {message.text}
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <Lock className="h-6 w-6 mr-2 text-purple-400" />
                    Transaction PIN Settings
                  </h2>

                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border border-purple-900/30 mb-6">
                    <form onSubmit={handlePinChange}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            New PIN (4 digits)
                          </label>
                          <div className="relative">
                            <input
                              type={pinData.showNew ? "text" : "password"}
                              value={pinData.newPin}
                              onChange={(e) => setPinData({...pinData, newPin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-center text-xl tracking-widest"
                              placeholder="Enter 4-digit PIN"
                              maxLength="4"
                            />
                            <button
                              type="button"
                              onClick={() => setPinData({...pinData, showNew: !pinData.showNew})}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {pinData.showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirm New PIN
                          </label>
                          <div className="relative">
                            <input
                              type={pinData.showConfirm ? "text" : "password"}
                              value={pinData.confirmPin}
                              onChange={(e) => setPinData({...pinData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-center text-xl tracking-widest"
                              placeholder="Confirm 4-digit PIN"
                              maxLength="4"
                            />
                            <button
                              type="button"
                              onClick={() => setPinData({...pinData, showConfirm: !pinData.showConfirm})}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {pinData.showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            type="submit"
                            disabled={loading || pinData.newPin.length !== 4 || pinData.confirmPin.length !== 4}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {loading ? (
                              <Loader className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                              <Lock className="h-5 w-5 mr-2" />
                            )}
                            {loading ? 'Updating...' : 'Update Transaction PIN'}
                          </button>
                        </div>
                      </div>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="flex items-center space-x-3 text-sm text-gray-400">
                        <Key className="h-4 w-4" />
                        <span>Your PIN is required for all wallet transactions</span>
                      </div>
                    </div>
                  </div>

                  {/* 2FA Section */}
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border border-blue-900/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-6 w-6 text-blue-400" />
                        <div>
                          <h3 className="font-bold">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-400">Add extra security to your account</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 rounded-lg transition-colors">
                        Enable
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-3">
                      When enabled, you'll need to enter a verification code from your authenticator app
                    </p>
                  </div>
                </div>
              )}

              {/* BANK DETAILS TAB */}
              {activeTab === 'bank' && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <CreditCard className="h-6 w-6 mr-2 text-green-400" />
                    Bank Account Details
                  </h2>

                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border border-green-900/30">
                    <form onSubmit={handleBankDetailsSave}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bank Name *
                          </label>
                          <input
                            type="text"
                            value={bankData.bank_name}
                            onChange={(e) => setBankData({...bankData, bank_name: e.target.value})}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., Access Bank"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bank Code (Optional)
                          </label>
                          <input
                            type="text"
                            value={bankData.bank_code}
                            onChange={(e) => setBankData({...bankData, bank_code: e.target.value})}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., 044"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            value={bankData.account_number}
                            onChange={(e) => setBankData({...bankData, account_number: e.target.value.replace(/\D/g, '')})}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="10-digit account number"
                            maxLength="10"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Account Name *
                          </label>
                          <input
                            type="text"
                            value={bankData.account_name}
                            onChange={(e) => setBankData({...bankData, account_name: e.target.value})}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Name on bank account"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="defaultAccount"
                            checked={bankData.is_default}
                            onChange={(e) => setBankData({...bankData, is_default: e.target.checked})}
                            className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-600"
                          />
                          <label htmlFor="defaultAccount" className="text-sm text-gray-300">
                            Set as default withdrawal account
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loading ? (
                            <Loader className="h-5 w-5 animate-spin mr-2" />
                          ) : (
                            <Save className="h-5 w-5 mr-2" />
                          )}
                          {loading ? 'Saving...' : 'Save Bank Details'}
                        </button>
                      </div>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                          <div className="text-sm text-yellow-300">
                            <p className="font-semibold">Security Notice</p>
                            <p className="mt-1">Bank details are encrypted and only used for withdrawal processing. They are never shared with third parties.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PREFERENCES TAB */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <Bell className="h-6 w-6 mr-2 text-yellow-400" />
                    Security Preferences
                  </h2>

                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border border-yellow-900/30 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Login Alerts</h3>
                        <p className="text-sm text-gray-400">Get notified when someone logs into your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityPrefs.login_alerts}
                          onChange={(e) => setSecurityPrefs({...securityPrefs, login_alerts: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Session Timeout</h3>
                      <p className="text-sm text-gray-400 mb-4">Automatically log out after inactivity</p>
                      <div className="flex space-x-3">
                        {[15, 30, 60, 120].map((minutes) => (
                          <button
                            key={minutes}
                            type="button"
                            onClick={() => setSecurityPrefs({...securityPrefs, session_timeout: minutes})}
                            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                              securityPrefs.session_timeout === minutes
                                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                            }`}
                          >
                            {minutes} min
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Require PIN for All Transactions</h3>
                        <p className="text-sm text-gray-400">Always ask for PIN when transferring or withdrawing</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityPrefs.require_pin_for_transactions}
                          onChange={(e) => setSecurityPrefs({...securityPrefs, require_pin_for_transactions: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <button
                      onClick={handleSecurityPrefsSave}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <Loader className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Save className="h-5 w-5 mr-2" />
                      )}
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}

              {/* DEVICES TAB */}
              {activeTab === 'devices' && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <Device className="h-6 w-6 mr-2 text-blue-400" />
                    Active Sessions
                  </h2>

                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border border-blue-900/30">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                        <div className="flex items-center space-x-3">
                          <Device className="h-5 w-5 text-blue-400" />
                          <div>
                            <div className="font-semibold">Chrome on Windows</div>
                            <div className="text-sm text-gray-400">Current session • Lagos, NG</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-sm">
                          Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                        <div className="flex items-center space-x-3">
                          <Device className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-semibold">Safari on iPhone</div>
                            <div className="text-sm text-gray-400">Yesterday • 192.168.1.1</div>
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-red-900/30 hover:bg-red-800/50 text-red-300 rounded-lg text-sm transition-colors">
                          Revoke
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <button className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center">
                        <LogOut className="h-5 w-5 mr-2" />
                        Log Out All Other Devices
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;