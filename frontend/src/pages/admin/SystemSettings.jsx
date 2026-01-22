import React, { useState, useEffect } from 'react';
import {
  Save, RefreshCw, Shield, DollarSign, Users,
  Globe, Bell, Lock, Database, Zap,
  CreditCard, TrendingUp, AlertCircle, CheckCircle,
  Gamepad, Trophy, Mail, MessageSquare, Settings as SettingsIcon,
  ShieldCheck, Key, Eye, EyeOff, Calendar, Clock,
  BarChart3, Wallet, Coins, Info, Filter, UserCheck,
  Plus, Trash2, Edit, Search, Image as ImageIcon,
  Send, Upload, X, AlertTriangle, HardDrive, RotateCcw,
  User, Mail as MailIcon, Filter as FilterIcon
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const SystemSettings = () => {
  // State for all settings
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'Xperience',
    platformCurrency: 'NGN',
    sessionTimeout: 15,
    
    // Financial Settings
    minDepositAmount: 500,
    maxDepositAmount: 100000,
    minWithdrawalAmount: 1000,
    maxWithdrawalAmount: 100000,
    withdrawalLimitDaily: 1,
    withdrawalLimitWeekly: 3,
    withdrawalLimitMonthly: 11,
    enableUSD: false,
    enableEUR: false,
    enableGBP: false,
    
    // User Settings
    enableRegistration: true,
    requireEmailVerification: false,
    defaultUserRank: 'E',
    maxLoginAttempts: 5,
    requireProfileCompletion: true,
    allowMultipleDevices: false,
    
    // Game Settings
    minMatchStakePercentage: 15,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    systemAnnouncements: true,
    
    // Security Settings
    enable2FA: false,
    requireTransactionPIN: true,
    enforceStrongPasswords: true,
    sessionEncryption: true,
    ipWhitelisting: false,
    
    // Maintenance Settings
    maintenanceMode: false,
    backupFrequency: 'daily',
    logRetentionDays: 30,
    cacheEnabled: true,
    
    // XP Rates
    xpRates: {}
  });

  const [xpRates, setXpRates] = useState({});
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [newGame, setNewGame] = useState({ name: '', category: 'other' });
  const [gameSearch, setGameSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const [maintenanceStatus, setMaintenanceStatus] = useState({});
  
  // Notification States
  const [notification, setNotification] = useState({
    subject: '',
    message: '',
    image: null,
    imagePreview: '',
    sendTo: 'all', // 'all', 'selected'
    selectedUsers: [],
    filters: {
      rank: '',
      minBalance: '',
      maxBalance: '',
      status: 'active',
      joinedAfter: '',
      joinedBefore: ''
    }
  });
  
  // Factory Reset States
  const [factoryReset, setFactoryReset] = useState({
    confirmText: '',
    backupBeforeReset: true,
    resetOptions: {
      userData: false,
      financialData: false,
      gameData: false,
      settings: false,
      logs: false
    }
  });
  
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [undoResetAvailable, setUndoResetAvailable] = useState(false);

  const [gameCategories] = useState([
    'shooter', 'moba', 'sports', 'racing', 'fighting', 
    'mmo', 'survival', 'battle_royale', 'strategy', 
    'mobile', 'card', 'casual', 'other'
  ]);

  const rankOptions = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
  const statusOptions = ['active', 'suspended', 'inactive'];

  useEffect(() => {
    loadSettings();
    loadXpRates();
    loadMaintenanceStatus();
    loadGames();
    loadUsers();
  }, []);

  useEffect(() => {
    if (gameSearch.trim() === '') {
      setFilteredGames(games);
    } else {
      const searchTerm = gameSearch.toLowerCase();
      const filtered = games.filter(game => 
        game.name.toLowerCase().includes(searchTerm) ||
        game.category.toLowerCase().includes(searchTerm) ||
        game.description?.toLowerCase().includes(searchTerm)
      );
      setFilteredGames(filtered);
    }
  }, [gameSearch, games]);

  useEffect(() => {
    applyUserFilters();
  }, [notification.filters, userSearch, availableUsers]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      if (response.settings) {
        const mappedSettings = {};
        response.settings.forEach(setting => {
          let value = setting.setting_value;
          if (value === 'true' || value === 'false') {
            value = value === 'true';
          } else if (!isNaN(value) && value !== '') {
            value = parseFloat(value);
          }
          mappedSettings[setting.setting_key] = value;
        });
        setSettings(prev => ({ ...prev, ...mappedSettings }));
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
        setSettings(prev => ({ ...prev, xpRates: response.rates }));
      }
    } catch (error) {
      console.error('Error loading XP rates:', error);
      const defaultRates = {
        'NGN': 0.025,
        'USD': 0,
        'EUR': 0,
        'GBP': 0
      };
      setXpRates(defaultRates);
      setSettings(prev => ({ ...prev, xpRates: defaultRates }));
    }
  };

  const loadGames = async () => {
    try {
      const response = await adminAPI.getGames('', 'true', '');
      if (response.success && response.games) {
        setGames(response.games);
        setFilteredGames(response.games);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to load games list'
      });
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers('', 1, 1000);
      if (response.success && response.users) {
        setAvailableUsers(response.users);
        setFilteredUsers(response.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMaintenanceStatus = async () => {
    try {
      const response = await adminAPI.getSystemHealth();
      setMaintenanceStatus(response.health || {});
    } catch (error) {
      console.error('Error loading maintenance status:', error);
      setMaintenanceStatus({
        api_status: 'online',
        database_status: 'connected',
        cache_status: 'active',
        server_load: 'normal'
      });
    }
  };

  const applyUserFilters = () => {
    let filtered = [...availableUsers];
    
    // Apply search
    if (userSearch.trim() !== '') {
      const searchTerm = userSearch.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.wallet_account_number?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply rank filter
    if (notification.filters.rank) {
      filtered = filtered.filter(user => user.rank === notification.filters.rank);
    }
    
    // Apply status filter
    if (notification.filters.status) {
      // Assuming users have account_status field
      filtered = filtered.filter(user => {
        if (notification.filters.status === 'active') return true; // Adjust based on your user structure
        return true; // Adjust this based on your actual user status field
      });
    }
    
    // Apply balance filters
    if (notification.filters.minBalance) {
      filtered = filtered.filter(user => user.balance >= parseFloat(notification.filters.minBalance));
    }
    
    if (notification.filters.maxBalance) {
      filtered = filtered.filter(user => user.balance <= parseFloat(notification.filters.maxBalance));
    }
    
    setFilteredUsers(filtered);
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleXpRateChange = (currency, value) => {
    const rate = parseFloat(value) || 0;
    setXpRates(prev => ({
      ...prev,
      [currency]: rate
    }));
    
    if (currency === 'USD') {
      setSettings(prev => ({ ...prev, enableUSD: rate > 0 }));
    } else if (currency === 'EUR') {
      setSettings(prev => ({ ...prev, enableEUR: rate > 0 }));
    } else if (currency === 'GBP') {
      setSettings(prev => ({ ...prev, enableGBP: rate > 0 }));
    }
  };

  const handleAddGame = async () => {
    if (!newGame.name.trim()) {
      setSaveMessage({ type: 'error', text: 'Game name is required' });
      return;
    }

    try {
      const response = await adminAPI.addGame({
        name: newGame.name,
        category: newGame.category,
        min_players: 2,
        max_players: 10,
        platforms: 'PC,Console,Mobile',
        description: `Added by admin`
      });

      if (response.success) {
        setSaveMessage({ type: 'success', text: 'Game added successfully' });
        setNewGame({ name: '', category: 'other' });
        loadGames();
        setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error adding game:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add game' 
      });
    }
  };

  const handleToggleGameStatus = async (id, name, currentStatus) => {
    try {
      const response = await adminAPI.updateGame(id, {
        is_active: !currentStatus
      });

      if (response.success) {
        setSaveMessage({ 
          type: 'success', 
          text: `Game ${currentStatus ? 'deactivated' : 'activated'} successfully` 
        });
        loadGames();
        setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error toggling game status:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update game status' });
    }
  };

  const handleDeleteGame = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await adminAPI.deleteGame(id);
        if (response.success) {
          setSaveMessage({ type: 'success', text: 'Game deleted successfully' });
          loadGames();
          setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
        }
      } catch (error) {
        console.error('Error deleting game:', error);
        setSaveMessage({ type: 'error', text: 'Failed to delete game' });
      }
    }
  };

  // Notification Handlers
  const handleNotificationChange = (field, value) => {
    setNotification(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (field, value) => {
    setNotification(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: value
      }
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setSaveMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setSaveMessage({ type: 'error', text: 'Please upload an image file' });
        return;
      }
      
      setNotification(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const removeImage = () => {
    setNotification(prev => ({
      ...prev,
      image: null,
      imagePreview: ''
    }));
  };

  const toggleUserSelection = (userId) => {
    setNotification(prev => {
      const isSelected = prev.selectedUsers.includes(userId);
      const newSelectedUsers = isSelected
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId];
      
      return {
        ...prev,
        selectedUsers: newSelectedUsers
      };
    });
  };

  const selectAllFilteredUsers = () => {
    const allIds = filteredUsers.map(user => user.id);
    setNotification(prev => ({
      ...prev,
      selectedUsers: [...new Set([...prev.selectedUsers, ...allIds])]
    }));
  };

  const deselectAllFilteredUsers = () => {
    const filteredIds = filteredUsers.map(user => user.id);
    setNotification(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.filter(id => !filteredIds.includes(id))
    }));
  };

  const clearAllSelections = () => {
    setNotification(prev => ({
      ...prev,
      selectedUsers: []
    }));
  };

  const sendNotification = async () => {
  console.log('📧 SIMPLE FIX: Starting sendNotification');
  console.log('📧 Current notification state:', notification);

  if (!notification.subject || !notification.subject.trim()) {
    setSaveMessage({ type: 'error', text: 'Subject is required' });
    return;
  }

  if (!notification.message || !notification.message.trim()) {
    setSaveMessage({ type: 'error', text: 'Message is required' });
    return;
  }

  if (notification.sendTo === 'selected' && notification.selectedUsers.length === 0) {
    setSaveMessage({ type: 'error', text: 'Please select at least one user' });
    return;
  }

  const confirmed = window.confirm(
    `Send this email to ${notification.sendTo === 'all' ? 'ALL users' : `${notification.selectedUsers.length} selected users`}?\n\n` +
    `This will send both:\n• Email notification to their email addresses\n• In-app notification in the platform`
  );

  if (!confirmed) return;

  setSendingNotification(true);

  try {
    // SIMPLE JSON payload - NO FORM DATA
    const payload = {
      subject: notification.subject.trim(),
      message: notification.message.trim(),
      recipientType: notification.sendTo,
      filters: notification.filters,
      recipients: notification.sendTo === 'selected' ? notification.selectedUsers : []
    };

    console.log('📧 SIMPLE FIX: Sending JSON payload:', payload);

    // Use fetch directly with JSON
    const token = localStorage.getItem('adminToken');
    const response = await fetch('http://localhost:5000/api/admin/send-email-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    console.log('📧 SIMPLE FIX: Response status:', response.status);
    
    const data = await response.json();
    console.log('📧 SIMPLE FIX: Response data:', data);

    if (response.ok && data.success) {
      setSaveMessage({ 
        type: 'success', 
        text: `✅ Success!\n• Emails sent: ${data.email_results?.sent || 0}/${data.email_results?.total || 0}\n• In-app notifications: ${data.broadcast_results?.sent || 0}/${data.broadcast_results?.total || 0}`
      });
      
      // Reset notification form
      setNotification({
        subject: '',
        message: '',
        image: null,
        imagePreview: '',
        sendTo: 'all',
        selectedUsers: [],
        filters: {
          rank: '',
          minBalance: '',
          maxBalance: '',
          status: 'active',
          joinedAfter: '',
          joinedBefore: ''
        }
      });
    } else {
      setSaveMessage({ 
        type: 'error', 
        text: data.message || 'Failed to send notification' 
      });
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    setSaveMessage({ 
      type: 'error', 
      text: error.message || 'Failed to send notification. Please try again.' 
    });
  } finally {
    setSendingNotification(false);
    setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
  }
};
  // Factory Reset Handlers
  const handleFactoryResetChange = (field, value) => {
    setFactoryReset(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetOptionChange = (option, value) => {
    setFactoryReset(prev => ({
      ...prev,
      resetOptions: {
        ...prev.resetOptions,
        [option]: value
      }
    }));
  };

  const performFactoryReset = async () => {
    if (factoryReset.confirmText !== 'RESET XPERIENCE') {
      setSaveMessage({ 
        type: 'error', 
        text: 'Please type "RESET XPERIENCE" exactly to confirm' 
      });
      return;
    }

    const selectedOptions = Object.entries(factoryReset.resetOptions)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    if (selectedOptions.length === 0) {
      setSaveMessage({ 
        type: 'error', 
        text: 'Please select at least one option to reset' 
      });
      return;
    }

    const confirmation = window.confirm(
      `WARNING: This will PERMANENTLY reset the following data:\n\n` +
      `${selectedOptions.join(', ').toUpperCase()}\n\n` +
      `This action cannot be undone. Are you absolutely sure?`
    );

    if (!confirmation) return;

    setResetting(true);

    try {
      // First, create backup if requested
      if (factoryReset.backupBeforeReset) {
        await adminAPI.backupDatabase();
        setSaveMessage({ 
          type: 'success', 
          text: 'Backup created successfully. Starting reset...' 
        });
      }

      // Call factory reset endpoint (needs to be created in admin.js)
      const response = await fetch('/api/admin/factory-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          resetOptions: factoryReset.resetOptions,
          backupBeforeReset: factoryReset.backupBeforeReset
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveMessage({ 
          type: 'success', 
          text: `Factory reset completed successfully!\n\n` +
                `Reset: ${selectedOptions.join(', ')}\n` +
                `Backup available for undo until next restart.`
        });
        
        setUndoResetAvailable(true);
        
        // Reset factory reset form
        setFactoryReset({
          confirmText: '',
          backupBeforeReset: true,
          resetOptions: {
            userData: false,
            financialData: false,
            gameData: false,
            settings: false,
            logs: false
          }
        });
        
        // Reload settings after reset
        setTimeout(() => {
          loadSettings();
          loadGames();
          loadUsers();
        }, 2000);
      } else {
        setSaveMessage({ 
          type: 'error', 
          text: data.message || 'Factory reset failed' 
        });
      }
    } catch (error) {
      console.error('Error performing factory reset:', error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Factory reset failed. Please check server logs.' 
      });
    } finally {
      setResetting(false);
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 8000);
    }
  };

  const undoFactoryReset = async () => {
    const confirmation = window.confirm(
      'This will restore the system from the last backup created before the reset. Continue?'
    );

    if (!confirmation) return;

    try {
      // Call undo reset endpoint (needs to be created in admin.js)
      const response = await fetch('/api/admin/undo-factory-reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveMessage({ 
          type: 'success', 
          text: 'Factory reset undone successfully! System restored from backup.' 
        });
        setUndoResetAvailable(false);
        
        // Reload settings
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setSaveMessage({ 
          type: 'error', 
          text: data.message || 'Failed to undo factory reset' 
        });
      }
    } catch (error) {
      console.error('Error undoing factory reset:', error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Failed to undo factory reset' 
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const settingsToSave = { ...settings };
      delete settingsToSave.xpRates;
      
      const settingsArray = Object.entries(settingsToSave).map(([key, value]) => ({
        key,
        value: typeof value === 'boolean' ? value.toString() : value.toString()
      }));

      await adminAPI.updateMultipleSettings(settingsArray);
      
      for (const [currency, rate] of Object.entries(xpRates)) {
        if (rate !== settings.xpRates[currency]) {
          await adminAPI.updateXpRate(currency, rate);
        }
      }
      
      setSaveMessage({
        type: 'success',
        text: 'Settings saved successfully!'
      });
      
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
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
    if (window.confirm('Clear all system cache?')) {
      try {
        await adminAPI.clearCache('all');
        setSaveMessage({
          type: 'success',
          text: 'Cache cleared successfully!'
        });
        setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error clearing cache:', error);
        setSaveMessage({ type: 'error', text: 'Error clearing cache' });
      }
    }
  };

  const handleBackupDatabase = async () => {
    if (window.confirm('Create database backup?')) {
      try {
        await adminAPI.backupDatabase();
        setSaveMessage({
          type: 'success',
          text: 'Backup initiated successfully!'
        });
        setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error backing up database:', error);
        setSaveMessage({ type: 'error', text: 'Error creating backup' });
      }
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Globe className="w-4 h-4" /> },
    { id: 'financial', label: 'Financial', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'games', label: 'Games', icon: <Gamepad className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'xp', label: 'XP Rates', icon: <Coins className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Database className="w-4 h-4" /> },
    { id: 'factory-reset', label: 'Factory Reset', icon: <RotateCcw className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading system settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center">
          <SettingsIcon className="w-6 h-6 mr-3 text-blue-400" />
          System Settings
        </h1>
        <p className="text-gray-300">Configure platform settings, financial rules, and system preferences</p>
      </div>

      {/* Save Message */}
      {saveMessage.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/30' 
            : saveMessage.type === 'error'
            ? 'bg-red-500/20 border border-red-500/30'
            : 'bg-yellow-500/20 border border-yellow-500/30'
        }`}>
          <div className="flex items-center">
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            ) : saveMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
            )}
            <span className="text-white whitespace-pre-line">{saveMessage.text}</span>
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
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-400" />
              General Platform Settings
            </h3>
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
                  disabled
                >
                  <option value="NGN">NGN (₦)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Currency can only be changed in Financial tab
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Session Timeout (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('general', 'sessionTimeout', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Percentage of session duration before timeout
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Settings */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-400" />
              Financial Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deposit Limits */}
              <div className="md:col-span-2">
                <h4 className="text-md font-semibold text-white mb-4 flex items-center">
                  <Wallet className="w-4 h-4 mr-2" />
                  Deposit Limits (₦)
                </h4>
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
                        min="500"
                        step="100"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        ₦
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
                        min="1000"
                        step="1000"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        ₦
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Withdrawal Limits */}
              <div className="md:col-span-2">
                <h4 className="text-md font-semibold text-white mb-4 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Withdrawal Limits (₦)
                </h4>
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
                        min="1000"
                        step="100"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        ₦
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
                        min="1000"
                        step="1000"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        ₦
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Withdrawal Frequency */}
              <div className="md:col-span-2">
                <h4 className="text-md font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Withdrawal Frequency Limits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Daily Limit
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={settings.withdrawalLimitDaily}
                      onChange={(e) => handleSettingChange('financial', 'withdrawalLimitDaily', parseInt(e.target.value))}
                      min="1"
                    />
                    <p className="mt-1 text-xs text-gray-500">Withdrawals per day</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Weekly Limit
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={settings.withdrawalLimitWeekly}
                      onChange={(e) => handleSettingChange('financial', 'withdrawalLimitWeekly', parseInt(e.target.value))}
                      min="1"
                    />
                    <p className="mt-1 text-xs text-gray-500">Withdrawals per week</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Monthly Limit
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={settings.withdrawalLimitMonthly}
                      onChange={(e) => handleSettingChange('financial', 'withdrawalLimitMonthly', parseInt(e.target.value))}
                      min="1"
                    />
                    <p className="mt-1 text-xs text-gray-500">Withdrawals per month</p>
                  </div>
                </div>
              </div>
              
              {/* Currency Options */}
              <div className="md:col-span-2">
                <h4 className="text-md font-semibold text-white mb-4 flex items-center">
                  <Coins className="w-4 h-4 mr-2" />
                  Currency Options
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div>
                      <h5 className="text-white font-medium">NGN (₦)</h5>
                      <p className="text-xs text-gray-400">Default currency</p>
                    </div>
                    <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                      Always On
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div>
                      <h5 className="text-white font-medium">USD ($)</h5>
                      <p className="text-xs text-gray-400">US Dollar</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.enableUSD}
                        onChange={(e) => handleSettingChange('financial', 'enableUSD', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div>
                      <h5 className="text-white font-medium">EUR (€)</h5>
                      <p className="text-xs text-gray-400">Euro</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.enableEUR}
                        onChange={(e) => handleSettingChange('financial', 'enableEUR', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div>
                      <h5 className="text-white font-medium">GBP (£)</h5>
                      <p className="text-xs text-gray-400">British Pound</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.enableGBP}
                        onChange={(e) => handleSettingChange('financial', 'enableGBP', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Settings */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-400" />
              User Management Settings
            </h3>
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
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Profile Completion</h4>
                  <p className="text-sm text-gray-400">Require profile completion</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.requireProfileCompletion}
                    onChange={(e) => handleSettingChange('users', 'requireProfileCompletion', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                  <option value="E">E - Newbie</option>
                  <option value="D">D - Bronze</option>
                  <option value="C">C - Silver</option>
                  <option value="B">B - Gold</option>
                  <option value="A">A - Platinum</option>
                  <option value="S">S - Diamond</option>
                  <option value="SS">SS - Elite</option>
                  <option value="SSS">SSS - Supreme</option>
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
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg md:col-span-2">
                <div>
                  <h4 className="text-white font-medium">Multiple Devices</h4>
                  <p className="text-sm text-gray-400">Allow multiple device logins</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.allowMultipleDevices}
                    onChange={(e) => handleSettingChange('users', 'allowMultipleDevices', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Game Settings */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Gamepad className="w-5 h-5 mr-2 text-yellow-400" />
              Game Management
            </h3>
            
            {/* Add New Game Form */}
            <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
              <h4 className="text-md font-semibold text-white mb-4">Add New Game</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Game Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newGame.name}
                    onChange={(e) => setNewGame(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter game name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newGame.category}
                    onChange={(e) => setNewGame(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {gameCategories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={handleAddGame}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Game
                  </button>
                </div>
              </div>
            </div>
            
            {/* Games List */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-white">
                  Available Games ({filteredGames.length})
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="pl-10 pr-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search games..."
                      value={gameSearch}
                      onChange={(e) => setGameSearch(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={loadGames}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 flex items-center"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="py-3 text-left pl-4">ID</th>
                      <th className="py-3 text-left">Game Name</th>
                      <th className="py-3 text-left">Category</th>
                      <th className="py-3 text-left">Players</th>
                      <th className="py-3 text-left">Platforms</th>
                      <th className="py-3 text-left">Status</th>
                      <th className="py-3 text-left pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGames.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-400">
                          No games found
                        </td>
                      </tr>
                    ) : (
                      filteredGames.map(game => (
                        <tr key={game.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 pl-4 text-gray-300">#{game.id}</td>
                          <td className="py-3 text-white">{game.name}</td>
                          <td className="py-3">
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                              {game.category}
                            </span>
                          </td>
                          <td className="py-3 text-gray-300">
                            {game.min_players}-{game.max_players}
                          </td>
                          <td className="py-3 text-gray-300">{game.platforms}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              game.is_active 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {game.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleToggleGameStatus(game.id, game.name, game.is_active)}
                                className={`px-2 py-1 rounded text-xs ${
                                  game.is_active 
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                }`}
                                title={game.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {game.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteGame(game.id, game.name)}
                                className="text-red-400 hover:text-red-300 p-1"
                                title="Delete Game"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Staked Matches Configuration */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-4">Staked Matches Configuration</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Minimum Staked Matches Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.minMatchStakePercentage}
                    onChange={(e) => handleSettingChange('games', 'minMatchStakePercentage', parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Percentage of total matches that must be staked for rank progression
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings - UPDATED WITH EMAIL */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <MailIcon className="w-5 h-5 mr-2 text-orange-400" />
              Email Notification System
            </h3>
            
            {/* Notification Settings Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-400">Send email notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Push Notifications</h4>
                  <p className="text-sm text-gray-400">Send push notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Admin Alerts</h4>
                  <p className="text-sm text-gray-400">Send admin alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.adminAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'adminAlerts', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            
            {/* Send Email Notification Form */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Send Email Notification
              </h4>
              
              {/* Email Subject */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject..."
                  value={notification.subject}
                  onChange={(e) => handleNotificationChange('subject', e.target.value)}
                />
              </div>
              
              {/* Email Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Message
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="6"
                  placeholder="Enter your message here..."
                  value={notification.message}
                  onChange={(e) => handleNotificationChange('message', e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  From: Xperience Platform &lt;noreply@xperience.com&gt;
                </p>
              </div>
              
              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Attach Image (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  {notification.imagePreview ? (
                    <div className="relative">
                      <img 
                        src={notification.imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors">
                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-xs text-gray-400">Upload Image</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                  <div>
                    <p className="text-sm text-gray-400">Max size: 5MB</p>
                    <p className="text-xs text-gray-500">Supports: JPG, PNG, GIF</p>
                  </div>
                </div>
              </div>
              
              {/* Recipient Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Send To
                </label>
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="mr-2"
                      checked={notification.sendTo === 'all'}
                      onChange={() => handleNotificationChange('sendTo', 'all')}
                    />
                    <span className="text-white">All Users ({availableUsers.length})</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="mr-2"
                      checked={notification.sendTo === 'selected'}
                      onChange={() => handleNotificationChange('sendTo', 'selected')}
                    />
                    <span className="text-white">Selected Users ({notification.selectedUsers.length})</span>
                  </label>
                </div>
                
                {/* User Filters for Selected Option */}
                {notification.sendTo === 'selected' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Rank</label>
                        <select
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm"
                          value={notification.filters.rank}
                          onChange={(e) => handleFilterChange('rank', e.target.value)}
                        >
                          <option value="">All Ranks</option>
                          {rankOptions.map(rank => (
                            <option key={rank} value={rank}>Rank {rank}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Status</label>
                        <select
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm"
                          value={notification.filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm"
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* User Selection Actions */}
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={selectAllFilteredUsers}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30"
                      >
                        Select All Filtered ({filteredUsers.length})
                      </button>
                      <button
                        onClick={deselectAllFilteredUsers}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
                      >
                        Deselect Filtered
                      </button>
                      <button
                        onClick={clearAllSelections}
                        className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    {/* Users List */}
                    <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr>
                            <th className="p-2 text-left text-gray-400 w-8"></th>
                            <th className="p-2 text-left text-gray-400">Username</th>
                            <th className="p-2 text-left text-gray-400">Email</th>
                            <th className="p-2 text-left text-gray-400">Rank</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(user => (
                            <tr key={user.id} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                              <td className="p-2">
                                <input
                                  type="checkbox"
                                  checked={notification.selectedUsers.includes(user.id)}
                                  onChange={() => toggleUserSelection(user.id)}
                                  className="rounded border-gray-600 bg-gray-800"
                                />
                              </td>
                              <td className="p-2 text-white">{user.username}</td>
                              <td className="p-2 text-gray-300">{user.email}</td>
                              <td className="p-2">
                                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                                  {user.rank || 'E'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <p className="text-sm text-gray-400 mt-2">
                      Selected: {notification.selectedUsers.length} users
                    </p>
                  </div>
                )}
              </div>
              
              {/* Send Button */}
              <div className="flex justify-end">
                <button
                  onClick={sendNotification}
                  disabled={sendingNotification || !notification.subject.trim() || !notification.message.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {sendingNotification ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email Notification
                    </>
                  )}
                </button>
              </div>
              
            {/* Test Configuration Button */}
<div className="mt-4 flex space-x-4">
  <button
    onClick={async () => {
      try {
        const response = await adminAPI.testEmailConfig('test@example.com');
        setSaveMessage({
          type: response.success ? 'success' : 'error',
          text: response.message || 'Test completed'
        });
      } catch (error) {
        setSaveMessage({
          type: 'error',
          text: error.message || 'Failed to test email configuration'
        });
      }
    }}
    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 flex items-center text-sm"
  >
    <Mail className="w-4 h-4 mr-2" />
    Test Email Configuration
  </button>
  
  <button
    onClick={() => {
      setNotification({
        ...notification,
        subject: 'Test Notification from Xperience',
        message: 'This is a test notification to verify the email system is working correctly. If you received this, the email notification system is functioning properly.',
        sendTo: 'all'
      });
      setSaveMessage({
        type: 'info',
        text: 'Test email loaded. Review and click Send to test.'
      });
    }}
    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 flex items-center text-sm"
  >
    <Mail className="w-4 h-4 mr-2" />
    Load Test Email
  </button>
</div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-red-400" />
              Security Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Enable 2FA</h4>
                  <p className="text-sm text-gray-400">Two-factor authentication</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enable2FA}
                    onChange={(e) => handleSettingChange('security', 'enable2FA', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
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
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Session Encryption</h4>
                  <p className="text-sm text-gray-400">Encrypt user sessions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.sessionEncryption}
                    onChange={(e) => handleSettingChange('security', 'sessionEncryption', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg md:col-span-2">
                <div>
                  <h4 className="text-white font-medium">IP Whitelisting</h4>
                  <p className="text-sm text-gray-400">Restrict access to specific IPs</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.ipWhitelisting}
                    onChange={(e) => handleSettingChange('security', 'ipWhitelisting', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* XP Rates Settings */}
        {activeTab === 'xp' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Coins className="w-5 h-5 mr-2 text-yellow-400" />
              XP Conversion Rates
            </h3>
            <p className="text-gray-400 mb-6">
              Set conversion rates for currency to XP points (1 unit of currency = X XP points)
              <br />
              <span className="text-yellow-400">Note: NGN is always enabled. Other currencies can be enabled in Financial tab.</span>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(xpRates).map(([currency, rate]) => (
                <div key={currency} className={`bg-gray-800/30 rounded-lg p-4 ${
                  currency === 'NGN' ? 'border border-green-500/30' : 'border border-gray-700/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-400">
                      1 {currency} = ? XP Points
                    </label>
                    {currency === 'NGN' && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Always Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <input
                        type="number"
                        className={`w-full px-3 py-2 bg-gray-800/50 border ${
                          currency === 'NGN' 
                            ? 'border-green-500/30 text-green-300' 
                            : 'border-gray-700 text-white'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        value={rate}
                        onChange={(e) => handleXpRateChange(currency, e.target.value)}
                        min="0"
                        step="0.001"
                        disabled={currency === 'NGN' && rate === 0.025}
                      />
                    </div>
                    <span className="ml-3 text-white font-medium">XP</span>
                  </div>
                  {currency === 'NGN' && (
                    <p className="mt-2 text-xs text-green-400">
                      Default rate: 25 XP per 1000 NGN (0.025 XP per 1 NGN)
                    </p>
                  )}
                  {rate === 0 && currency !== 'NGN' && (
                    <p className="mt-2 text-xs text-red-400">
                      Currency disabled. Enable in Financial tab to set rate.
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-medium mb-1">Important Configuration Note</h4>
                  <p className="text-sm text-gray-300">
                    • NGN is the primary currency and cannot be disabled<br />
                    • Other currencies (USD, EUR, GBP) must be enabled in the Financial tab first<br />
                    • Changing XP rates affects all future currency conversions<br />
                    • Existing XP balances will not be adjusted automatically
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Settings */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-400" />
              System Maintenance
            </h3>
            
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
                  Clear Cache Now
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
                  Backup Database Now
                </button>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-6 md:col-span-2">
                <div className="flex items-start mb-4">
                  <SettingsIcon className="w-6 h-6 text-purple-400 mr-3" />
                  <div>
                    <h4 className="text-white font-medium mb-1">Maintenance Mode</h4>
                    <p className="text-sm text-gray-400">
                      Put the system in maintenance mode for updates and fixes.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${settings.maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <span className="text-white">
                      {settings.maintenanceMode ? 'Maintenance Mode Active' : 'System Online'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange('maintenance', 'maintenanceMode', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400 mr-3" />
                <div>
                  <h4 className="text-white font-medium mb-1">System Health Dashboard</h4>
                  <p className="text-sm text-gray-400">
                    Real-time system performance and status monitoring.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">API Status</div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      maintenanceStatus.api_status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-white font-medium capitalize">
                      {maintenanceStatus.api_status || 'Checking...'}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Database</div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      maintenanceStatus.database_status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-white font-medium capitalize">
                      {maintenanceStatus.database_status || 'Checking...'}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Cache</div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      maintenanceStatus.cache_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-white font-medium capitalize">
                      {maintenanceStatus.cache_status || 'Checking...'}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Server Load</div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      maintenanceStatus.server_load === 'normal' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-white font-medium capitalize">
                      {maintenanceStatus.server_load || 'Checking...'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Configuration Options */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.backupFrequency}
                    onChange={(e) => handleSettingChange('maintenance', 'backupFrequency', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Log Retention (Days)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.logRetentionDays}
                    onChange={(e) => handleSettingChange('maintenance', 'logRetentionDays', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div>
                    <h5 className="text-white text-sm font-medium">Cache Enabled</h5>
                    <p className="text-xs text-gray-400">System caching</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.cacheEnabled}
                      onChange={(e) => handleSettingChange('maintenance', 'cacheEnabled', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Factory Reset Tab - NEW */}
        {activeTab === 'factory-reset' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <RotateCcw className="w-5 h-5 mr-2 text-red-400" />
              Factory Reset
            </h3>
            
            <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-red-400 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-medium mb-2">⚠️ CRITICAL WARNING</h4>
                  <p className="text-gray-300">
                    Factory reset will PERMANENTLY delete data from your Xperience platform. 
                    This action cannot be undone except through the Undo button immediately after reset.
                    Make sure you have a backup before proceeding.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Reset Options */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-white mb-4">Select Data to Reset</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div>
                    <h5 className="text-white font-medium">User Data</h5>
                    <p className="text-sm text-gray-400">Reset all user accounts and profiles</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={factoryReset.resetOptions.userData}
                      onChange={(e) => handleResetOptionChange('userData', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div>
                    <h5 className="text-white font-medium">Financial Data</h5>
                    <p className="text-sm text-gray-400">Reset transactions, balances, and payments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={factoryReset.resetOptions.financialData}
                      onChange={(e) => handleResetOptionChange('financialData', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div>
                    <h5 className="text-white font-medium">Game Data</h5>
                    <p className="text-sm text-gray-400">Reset matches, tournaments, and game stats</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={factoryReset.resetOptions.gameData}
                      onChange={(e) => handleResetOptionChange('gameData', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div>
                    <h5 className="text-white font-medium">System Settings</h5>
                    <p className="text-sm text-gray-400">Reset all system settings to defaults</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={factoryReset.resetOptions.settings}
                      onChange={(e) => handleResetOptionChange('settings', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg md:col-span-2">
                  <div>
                    <h5 className="text-white font-medium">System Logs</h5>
                    <p className="text-sm text-gray-400">Clear all system and admin logs</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={factoryReset.resetOptions.logs}
                      onChange={(e) => handleResetOptionChange('logs', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Backup Option */}
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Create Backup Before Reset</h4>
                  <p className="text-sm text-gray-400">Recommended: Creates restore point before resetting</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={factoryReset.backupBeforeReset}
                    onChange={(e) => handleFactoryResetChange('backupBeforeReset', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            
            {/* Confirmation */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Type "RESET XPERIENCE" to confirm
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-800/50 border border-red-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="RESET XPERIENCE"
                value={factoryReset.confirmText}
                onChange={(e) => handleFactoryResetChange('confirmText', e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                This action is irreversible. Please be certain.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              {undoResetAvailable && (
                <button
                  onClick={undoFactoryReset}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Undo Last Reset
                </button>
              )}
              
              <button
                onClick={performFactoryReset}
                disabled={resetting || factoryReset.confirmText !== 'RESET XPERIENCE'}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {resetting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4 mr-2" />
                    Perform Factory Reset
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
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