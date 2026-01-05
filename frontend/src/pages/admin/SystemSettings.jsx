import React, { useState, useEffect } from 'react';
import {
  Save, RefreshCw, Shield, DollarSign, Users,
  Globe, Bell, Lock, Database, Zap,
  CreditCard, TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'Xperience',
    platformCurrency: 'USD',
    platformFeePercentage: 15,
    minDepositAmount: 1,
    maxDepositAmount: 10000,
    minWithdrawalAmount: 10,
    maxWithdrawalAmount: 5000,
    
    // User Settings
    enableRegistration: true,
    requireEmailVerification: true,
    defaultUserRank: 'E',
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    
    // Game Settings
    minMatchStake: 1,
    maxMatchStake: 1000,
    minTournamentEntry: 10,
    defaultPrizePoolPercentage: 85,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    
    // Security Settings
    enable2FA: true,
    requireTransactionPIN: true,
    enforceStrongPasswords: true,
    
    // XP Rates
    xpRates: {
      USD: 20.83,
      NGN: 0.048,
      EUR: 22.73,
      GBP: 26.32
    }
  });

  const [xpRates, setXpRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
    loadXpRates();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      if (response.settings) {
        setSettings(prev => ({ ...prev, ...response.settings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadXpRates = async () => {
    try {
      const response = await adminAPI.getXpRates();
      if (response.rates) {
        setXpRates(response.rates);
      }
    } catch (error) {
      console.error('Error loading XP rates:', error);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleXpRateChange = (currency, value) => {
    setXpRates(prev => ({
      ...prev,
      [currency]: parseFloat(value) || 0
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Save main settings
      const settingsToSave = { ...settings };
      delete settingsToSave.xpRates; // Remove XP rates for separate save
      
      const response = await adminAPI.updateMultipleSettings(settingsToSave);
      
      // Save XP rates
      for (const [currency, rate] of Object.entries(xpRates)) {
        await adminAPI.updateXpRate(currency, rate);
      }
      
      setSaveMessage({
        type: 'success',
        text: 'Settings saved successfully!'
      });
      
      setTimeout(() => {
        setSaveMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Error saving settings. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Clear all system cache? This may improve performance but will require users to reload data.')) {
      try {
        await adminAPI.clearCache('all');
        setSaveMessage({
          type: 'success',
          text: 'Cache cleared successfully!'
        });
        setTimeout(() => {
          setSaveMessage({ type: '', text: '' });
        }, 3000);
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  };

  const handleBackupDatabase = async () => {
    if (window.confirm('Create database backup? This may take a few moments.')) {
      try {
        await adminAPI.backupDatabase();
        setSaveMessage({
          type: 'success',
          text: 'Backup initiated successfully!'
        });
        setTimeout(() => {
          setSaveMessage({ type: '', text: '' });
        }, 3000);
      } catch (error) {
        console.error('Error backing up database:', error);
      }
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Globe className="w-4 h-4" /> },
    { id: 'financial', label: 'Financial', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'games', label: 'Games', icon: <Zap className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'xp', label: 'XP Rates', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Database className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-gray-300">Configure platform settings, financial rules, and system preferences</p>
      </div>

      {/* Save Message */}
      {saveMessage.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          <div className="flex items-center">
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            )}
            <span className="text-white">{saveMessage.text}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-800/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-white border-t border-l border-r border-gray-700'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Forms */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 mb-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">General Platform Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Platform Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.platformName}
                  onChange={(e) => handleSettingChange('general', 'platformName', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Default Currency
                </label>
                <select
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.platformCurrency}
                  onChange={(e) => handleSettingChange('general', 'platformCurrency', e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('general', 'sessionTimeout', parseInt(e.target.value))}
                  min="1"
                  max="1440"
                />
              </div>
            </div>
          </div>
        )}

        {/* Financial Settings */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Financial Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Platform Fee Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.platformFeePercentage}
                    onChange={(e) => handleSettingChange('financial', 'platformFeePercentage', parseFloat(e.target.value))}
                    min="0"
                    max="50"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Percentage taken from each transaction (recommended: 10-20%)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Default Prize Pool Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.defaultPrizePoolPercentage}
                    onChange={(e) => handleSettingChange('financial', 'defaultPrizePoolPercentage', parseFloat(e.target.value))}
                    min="50"
                    max="100"
                    step="1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Percentage of entry fees that goes to prize pool
                </p>
              </div>
              
              <div className="md:col-span-2">
                <h4 className="text-md font-semibold text-white mb-4">Deposit Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Minimum Deposit
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={settings.minDepositAmount}
                        onChange={(e) => handleSettingChange('financial', 'minDepositAmount', parseFloat(e.target.value))}
                        min="0.01"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {settings.platformCurrency}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Maximum Deposit
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={settings.maxDepositAmount}
                        onChange={(e) => handleSettingChange('financial', 'maxDepositAmount', parseFloat(e.target.value))}
                        min="1"
                        step="1"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {settings.platformCurrency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h4 className="text-md font-semibold text-white mb-4">Withdrawal Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Minimum Withdrawal
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={settings.minWithdrawalAmount}
                        onChange={(e) => handleSettingChange('financial', 'minWithdrawalAmount', parseFloat(e.target.value))}
                        min="0.01"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {settings.platformCurrency}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Maximum Withdrawal
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={settings.maxWithdrawalAmount}
                        onChange={(e) => handleSettingChange('financial', 'maxWithdrawalAmount', parseFloat(e.target.value))}
                        min="1"
                        step="1"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {settings.platformCurrency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Settings */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Enable Registration</h4>
                  <p className="text-sm text-gray-400">Allow new users to register</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableRegistration}
                    onChange={(e) => handleSettingChange('users', 'enableRegistration', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Email Verification</h4>
                  <p className="text-sm text-gray-400">Require email verification</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => handleSettingChange('users', 'requireEmailVerification', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Default User Rank
                </label>
                <select
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.defaultUserRank}
                  onChange={(e) => handleSettingChange('users', 'defaultUserRank', e.target.value)}
                >
                  <option value="E">E - Beginner</option>
                  <option value="D">D - Amateur</option>
                  <option value="C">C - Intermediate</option>
                  <option value="B">B - Advanced</option>
                  <option value="A">A - Expert</option>
                  <option value="S">S - Master</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('users', 'maxLoginAttempts', parseInt(e.target.value))}
                  min="1"
                  max="10"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Account locked after failed attempts
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Game Settings */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Game Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h4 className="text-md font-semibold text-white mb-4">Match Stakes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Minimum Match Stake
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={settings.minMatchStake}
                        onChange={(e) => handleSettingChange('games', 'minMatchStake', parseFloat(e.target.value))}
                        min="0.01"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {settings.platformCurrency}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Maximum Match Stake
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={settings.maxMatchStake}
                        onChange={(e) => handleSettingChange('games', 'maxMatchStake', parseFloat(e.target.value))}
                        min="1"
                        step="1"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {settings.platformCurrency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Minimum Tournament Entry
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.minTournamentEntry}
                    onChange={(e) => handleSettingChange('games', 'minTournamentEntry', parseFloat(e.target.value))}
                    min="0.01"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {settings.platformCurrency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-400">Send email notifications to users</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Push Notifications</h4>
                  <p className="text-sm text-gray-400">Send push notifications to users</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Admin Alerts</h4>
                  <p className="text-sm text-gray-400">Send alerts to administrators</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.adminAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'adminAlerts', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Enable 2FA</h4>
                  <p className="text-sm text-gray-400">Require two-factor authentication</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enable2FA}
                    onChange={(e) => handleSettingChange('security', 'enable2FA', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Transaction PIN</h4>
                  <p className="text-sm text-gray-400">Require PIN for transactions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.requireTransactionPIN}
                    onChange={(e) => handleSettingChange('security', 'requireTransactionPIN', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg md:col-span-2">
                <div>
                  <h4 className="text-white font-medium">Strong Passwords</h4>
                  <p className="text-sm text-gray-400">Enforce strong password policies</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enforceStrongPasswords}
                    onChange={(e) => handleSettingChange('security', 'enforceStrongPasswords', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* XP Rates Settings */}
        {activeTab === 'xp' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">XP Conversion Rates</h3>
            <p className="text-gray-400 mb-6">Set conversion rates for converting currency to XP points (1 unit of currency = X XP points)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(settings.xpRates).map(([currency, rate]) => (
                <div key={currency} className="bg-gray-800/30 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    1 {currency} = ? XP Points
                  </label>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={xpRates[currency] || rate}
                        onChange={(e) => handleXpRateChange(currency, e.target.value)}
                        min="0"
                        step="0.001"
                        placeholder="Enter XP rate"
                      />
                    </div>
                    <span className="ml-3 text-white font-medium">XP</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Current: 1 {currency} = {rate} XP points
                  </p>
                </div>
              ))}
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-medium mb-1">Important Note</h4>
                  <p className="text-sm text-gray-300">
                    Changing XP rates will affect all future conversions. Existing XP balances will not be adjusted.
                    Make sure to communicate rate changes to users if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Settings */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Maintenance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/30 rounded-lg p-6">
                <div className="flex items-start mb-4">
                  <RefreshCw className="w-6 h-6 text-blue-400 mr-3" />
                  <div>
                    <h4 className="text-white font-medium mb-1">Clear System Cache</h4>
                    <p className="text-sm text-gray-400">
                      Clear all cached data to improve performance and reload fresh data.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearCache}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Clear Cache
                </button>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-6">
                <div className="flex items-start mb-4">
                  <Database className="w-6 h-6 text-green-400 mr-3" />
                  <div>
                    <h4 className="text-white font-medium mb-1">Backup Database</h4>
                    <p className="text-sm text-gray-400">
                      Create a complete backup of the database for safety and recovery.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBackupDatabase}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Backup Database
                </button>
              </div>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <Zap className="w-6 h-6 text-purple-400 mr-3" />
                <div>
                  <h4 className="text-white font-medium mb-1">System Health Check</h4>
                  <p className="text-sm text-gray-400">
                    Check system performance, database connections, and server status.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">API Status</div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-white font-medium">Online</span>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Database</div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-white font-medium">Connected</span>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Cache</div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-white font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;