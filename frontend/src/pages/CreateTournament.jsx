import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { tournamentsAPI } from '../utils/api'
import { 
  Trophy, Gamepad2, Users, Calendar, DollarSign, ArrowLeft, 
  Plus, Shield, Crown, Target, AlertCircle, Check, X,
  Eye, Lock, Unlock, Shield as AdminShield
} from 'lucide-react'

const CreateTournament = () => {
  const [formData, setFormData] = useState({
    name: '',
    game: 'Call of Duty: Warzone',
    description: '',
    max_players: 8,
    entry_fee: 0,
    prize_pool_option: 'entry_fee',
    custom_prize_pool: 0,
    type: '1v1', // Default to 1v1 instead of squad
    start_date: '',
    group_id: '',
    squad_name: '',
    max_squads: 8,
    admin_monitoring: false, // New: Admin monitoring option
    admin_pin: '', // New: Admin PIN for monitoring
    dispute_resolution: 'auto' // New: auto, admin, voting
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userGroups, setUserGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [xpBalance, setXpBalance] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])
  const [showAdminOptions, setShowAdminOptions] = useState(false)

  const { user } = useAuth()
  const navigate = useNavigate()

  const games = [
    'Call of Duty: Warzone',
    'Call of Duty: Mobile',
    'PUBG Mobile',
    'Free Fire',
    'Fortnite',
    'Valorant',
    'Dota 2',
    'FIFA 23',
    'Other'
  ]

  const tournamentTypes = [
    { 
      value: '1v1', 
      label: '1 vs 1 Tournament',
      description: 'Head-to-head bracket elimination',
      icon: <Target className="w-4 h-4" />,
      canCreate: true,
      adminOnly: false
    },
    { 
      value: 'freeforall', 
      label: 'Free for All',
      description: 'Open tournament for anyone',
      icon: <Users className="w-4 h-4" />,
      canCreate: true,
      adminOnly: false
    },
    { 
      value: 'squad', 
      label: 'Squad Tournament',
      description: 'Group-based competition (Group admins only)',
      icon: <Shield className="w-4 h-4" />,
      canCreate: true,
      adminOnly: false
    },
    { 
      value: 'survival', 
      label: 'Survival of the Fittest',
      description: 'Platform-hosted tournament (Admins only)',
      icon: <Crown className="w-4 h-4" />,
      canCreate: false, // Will check admin status
      adminOnly: true
    }
  ]

  const disputeResolutionOptions = [
    { value: 'auto', label: 'Automatic (First submission wins)', description: 'First result submission is accepted' },
    { value: 'admin', label: 'Admin Resolution', description: 'Admins review disputed matches' },
    { value: 'voting', label: 'Community Voting', description: 'Tournament participants vote' }
  ]

  // In CreateTournament.jsx useEffect, replace the XP fetching part:

// In CreateTournament.jsx useEffect:

useEffect(() => {
  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Check if user is admin
      setIsAdmin(user.is_admin || false);
      
      // ✅ FIX: Use tournamentsAPI.getUserProfile() which already exists
      try {
        const response = await tournamentsAPI.getUserProfile();
        console.log('🎮 getUserProfile response:', response);
        
        // Handle different response structures
        if (response.success && response.data) {
          // Structure 1: {success: true, data: {user: {xp_points: ...}}}
          const xpPoints = response.data.user?.xp_points || 
                          response.data.xp_points || 
                          response.xp_points || 
                          0;
          setXpBalance(xpPoints);
          console.log('✅ XP balance set to:', xpPoints);
        } else if (response.xp_points !== undefined) {
          // Structure 2: {success: true, xp_points: ...}
          setXpBalance(response.xp_points);
        } else {
          console.warn('⚠️ Unexpected response structure:', response);
          setXpBalance(0);
        }
      } catch (xpError) {
        console.error('❌ Error fetching XP via getUserProfile:', xpError);
        
        // Fallback: Try getUserXP method
        try {
          const xpResponse = await tournamentsAPI.getUserXP();
          console.log('🔄 getUserXP response:', xpResponse);
          
          if (xpResponse.success) {
            setXpBalance(xpResponse.xp_points || 0);
          } else {
            setXpBalance(0);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback XP fetch also failed:', fallbackError);
          setXpBalance(0);
        }
      }
      
      // Fetch user's admin groups for squad tournaments
      setLoadingGroups(true);
      try {
        const groupsResponse = await tournamentsAPI.getUserGroups();
        console.log('👥 getUserGroups response:', groupsResponse);
        
        if (groupsResponse.success) {
          setUserGroups(groupsResponse.groups || []);
        } else {
          console.error('Groups fetch failed:', groupsResponse);
          setUserGroups([]);
        }
      } catch (groupError) {
        console.error('❌ Error fetching groups:', groupError);
        setUserGroups([]);
      } finally {
        setLoadingGroups(false);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchUserData:', error);
      setXpBalance(0);
    }
  };
  
  fetchUserData();
}, [user]);

  const handleChange = (e) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
    
    setError('')
    
    // When group is selected, fetch group members
    if (name === 'group_id' && value) {
      const group = userGroups.find(g => g.id == value)
      setSelectedGroup(group)
      if (group?.member_ids) {
        setGroupMembers(group.member_ids)
      }
    }
    
    // Clear group data when tournament type changes away from squad
    if (name === 'type' && value !== 'squad') {
      setFormData(prev => ({
        ...prev,
        group_id: '',
        squad_name: '',
        max_squads: 8
      }))
      setSelectedGroup(null)
      setGroupMembers([])
    }
    
    // Show admin options for Survival tournaments
    if (name === 'type') {
      if (value === 'survival') {
        setFormData(prev => ({
          ...prev,
          admin_monitoring: true, // Force admin monitoring for Survival
          dispute_resolution: 'admin' // Force admin resolution for Survival
        }))
        setShowAdminOptions(true)
      } else {
        setShowAdminOptions(false)
      }
    }
  }

  const calculatePrizePool = () => {
    if (formData.prize_pool_option === 'entry_fee') {
      return (formData.entry_fee * formData.max_players) * 0.85
    } else {
      return (formData.custom_prize_pool || 0) * 0.85
    }
  }

  const calculatePlatformFee = () => {
    if (formData.prize_pool_option === 'entry_fee') {
      return (formData.entry_fee * formData.max_players) * 0.15
    } else {
      return (formData.custom_prize_pool || 0) * 0.15
    }
  }

  const validateForm = () => {
    // Required fields
    if (!formData.name.trim()) {
      setError('Tournament name is required')
      return false
    }

    if (!formData.start_date) {
      setError('Start date is required')
      return false
    }

    // Type-specific validations
    if (formData.type === 'squad') {
      if (!formData.group_id) {
        setError('Please select a group for squad tournament')
        return false
      }
      
      if (selectedGroup && (selectedGroup.member_count < 1 || selectedGroup.member_count > 5)) {
        setError('Selected group must have 1-5 members')
        return false
      }
    }

    if (formData.type === 'survival' && !isAdmin) {
      setError('Only admins can create Survival tournaments')
      return false
    }

    // XP balance check
    if (formData.entry_fee > 0 && formData.entry_fee > xpBalance) {
      setError(`Insufficient XP balance. You need ${formData.entry_fee} XP, you have ${xpBalance} XP`)
      return false
    }

    // Prize pool validation
    if (formData.prize_pool_option === 'custom' && (!formData.custom_prize_pool || formData.custom_prize_pool <= 0)) {
      setError('Custom prize pool must be greater than 0')
      return false
    }

    // Admin PIN validation
    if (formData.admin_monitoring && formData.admin_pin && formData.admin_pin.length !== 4) {
      setError('Admin PIN must be 4 digits')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await tournamentsAPI.create(formData)
      
      if (response.success) {
        alert('Tournament created successfully!')
        navigate('/tournaments')
      } else {
        setError(response.error || 'Failed to create tournament')
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create tournament')
      console.error('Create tournament error:', error)
    } finally {
      setLoading(false)
    }
  }

  const minDate = new Date()
  minDate.setHours(minDate.getHours() + 1)

  // Check if user can create specific tournament type
  const canCreateTournamentType = (typeValue) => {
    const type = tournamentTypes.find(t => t.value === typeValue)
    
    if (!type) return false
    
    // Survival requires admin
    if (type.adminOnly && !isAdmin) return false
    
    // Squad requires group admin
    if (typeValue === 'squad' && userGroups.length === 0) return false
    
    return true
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/tournaments')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Create Tournament</h1>
              <p className="text-gray-400">Set up your competitive gaming tournament</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Your XP Balance</div>
              <div className="text-xl font-bold text-green-400">{xpBalance.toLocaleString()} XP</div>
            </div>
            <div className="w-12 h-12 bg-purple-gradient rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Creation Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Gamepad2 className="w-5 h-5" />
              <span>Basic Information</span>
            </h2>
            
            <div className="space-y-4">
              {/* Tournament Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tournament Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-primary w-full"
                  placeholder="Enter tournament name"
                  maxLength="100"
                />
              </div>

              {/* Game Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game *
                </label>
                <select
                  name="game"
                  value={formData.game}
                  onChange={handleChange}
                  className="input-primary w-full"
                >
                  {games.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="input-primary w-full resize-none"
                  placeholder="Describe your tournament rules, requirements, etc."
                  maxLength="500"
                />
              </div>
            </div>
          </div>

          {/* Tournament Settings */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Tournament Settings</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tournament Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tournament Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-primary w-full"
                >
                  {tournamentTypes.map(type => (
                    <option 
                      key={type.value} 
                      value={type.value}
                      disabled={!canCreateTournamentType(type.value)}
                      className={!canCreateTournamentType(type.value) ? 'text-gray-500' : ''}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {tournamentTypes.find(t => t.value === formData.type)?.description}
                  {formData.type === 'squad' && userGroups.length === 0 && (
                    <span className="text-yellow-400 block mt-1">
                      You need to be a group admin to create squad tournaments
                    </span>
                  )}
                  {formData.type === 'survival' && !isAdmin && (
                    <span className="text-yellow-400 block mt-1">
                      Only admins can create Survival tournaments
                    </span>
                  )}
                </p>
              </div>

              {/* Max Players */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Players *
                </label>
                <input
                  type="number"
                  name="max_players"
                  value={formData.max_players}
                  onChange={handleChange}
                  min="2"
                  max="100"
                  required
                  className="input-primary w-full"
                />
              </div>

              {/* Start Date */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  min={minDate.toISOString().slice(0, 16)}
                  required
                  className="input-primary w-full"
                />
              </div>
            </div>
          </div>

          {/* Squad Tournament Fields */}
          {formData.type === 'squad' && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Squad Tournament Settings</span>
              </h3>
              
              <div className="space-y-4">
                {/* Group Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Your Group *
                  </label>
                  {loadingGroups ? (
                    <div className="input-primary w-full text-center py-2">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : userGroups.length === 0 ? (
                    <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>You are not an admin of any groups with 1-5 members.</span>
                      </div>
                      <a href="/groups" className="underline ml-7 hover:text-yellow-300">
                        Manage your groups
                      </a>
                    </div>
                  ) : (
                    <select
                      name="group_id"
                      value={formData.group_id}
                      onChange={handleChange}
                      required
                      className="input-primary w-full"
                    >
                      <option value="">Select a Group</option>
                      {userGroups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.member_count}/5 members) - {group.game_specialty}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Selected Group Info */}
                {selectedGroup && (
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-white">{selectedGroup.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedGroup.member_count >= 1 && selectedGroup.member_count <= 5
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedGroup.member_count} members
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{selectedGroup.description}</p>
                    <div className="text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400">Game Specialty:</span>
                        <span className="text-white">{selectedGroup.game_specialty}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`flex items-center space-x-1 ${
                          selectedGroup.member_count >= 1 && selectedGroup.member_count <= 5
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          {selectedGroup.member_count >= 1 && selectedGroup.member_count <= 5 ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Valid for tournament</span>
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              <span>Needs 1-5 members</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Squad Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Squad Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="squad_name"
                    value={formData.squad_name}
                    onChange={handleChange}
                    className="input-primary w-full"
                    placeholder="e.g., Team Phoenix, Alpha Warriors"
                    maxLength="50"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Custom name for your squad in this tournament
                  </p>
                </div>

                {/* Max Squads */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum Squads
                  </label>
                  <input
                    type="number"
                    name="max_squads"
                    value={formData.max_squads}
                    onChange={handleChange}
                    min="2"
                    max="32"
                    className="input-primary w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum number of groups that can join this tournament
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Monitoring & Dispute Resolution */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <AdminShield className="w-5 h-5" />
              <span>Admin Monitoring & Dispute Resolution</span>
            </h3>
            
            <div className="space-y-4">
              {/* Enable Admin Monitoring */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white mb-1">Enable Admin Monitoring</h4>
                  <p className="text-sm text-gray-400">
                    Allows admins to monitor matches and resolve disputes
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="admin_monitoring"
                    checked={formData.admin_monitoring || formData.type === 'survival'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      admin_monitoring: e.target.checked
                    }))}
                    disabled={formData.type === 'survival'} // Always on for Survival
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${
                    formData.type === 'survival' ? 'bg-purple-500' : 'bg-gray-700'
                  } peer-checked:bg-purple-600 peer-disabled:opacity-50`}>
                    <div className={`dot absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all ${
                      (formData.admin_monitoring || formData.type === 'survival') 
                        ? 'translate-x-5 bg-white' 
                        : 'bg-gray-300'
                    }`} />
                  </div>
                </label>
              </div>

              {formData.type === 'survival' && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-purple-400">
                    <Crown className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Admin monitoring is always enabled for Survival tournaments
                    </span>
                  </div>
                </div>
              )}

              {/* Admin PIN */}
              {formData.admin_monitoring && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin PIN (Optional, 4 digits)
                  </label>
                  <input
                    type="password"
                    name="admin_pin"
                    value={formData.admin_pin}
                    onChange={handleChange}
                    maxLength="4"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="input-primary w-full"
                    placeholder="1234"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Required for admins to access match monitoring. Leave empty for no PIN.
                  </p>
                </div>
              )}

              {/* Dispute Resolution */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dispute Resolution Method
                </label>
                <select
                  name="dispute_resolution"
                  value={formData.dispute_resolution}
                  onChange={handleChange}
                  className="input-primary w-full"
                  disabled={formData.type === 'survival'}
                >
                  {disputeResolutionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {disputeResolutionOptions.find(d => d.value === formData.dispute_resolution)?.description}
                  {formData.type === 'survival' && (
                    <span className="text-purple-400 block">
                      Admin resolution is required for Survival tournaments
                    </span>
                  )}
                </p>
              </div>

              {/* Admin Monitoring Benefits */}
              {formData.admin_monitoring && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Admin Monitoring Benefits:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start space-x-2">
                      <Eye className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Real-time match observation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Dispute resolution by admins</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Lock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Match result verification</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Unlock className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Admin override for disputed matches</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Prize Pool Settings */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Prize Pool Settings (XP)</span>
            </h2>
            
            <div className="space-y-4">
              {/* Entry Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Fee (XP)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="entry_fee"
                    value={formData.entry_fee}
                    onChange={handleChange}
                    min="0"
                    step="10"
                    className="input-primary w-full pl-12"
                    placeholder="0 for free tournament"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    XP
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-400">
                    XP will be deducted from your account
                  </p>
                  {formData.entry_fee > 0 && (
                    <p className={`text-xs ${
                      formData.entry_fee > xpBalance ? 'text-red-400' : 'text-green-400'
                    }`}>
                      Your balance: {xpBalance.toLocaleString()} XP
                    </p>
                  )}
                </div>
              </div>

              {/* Prize Pool Option */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prize Pool Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="prize_pool_option"
                      value="entry_fee"
                      checked={formData.prize_pool_option === 'entry_fee'}
                      onChange={handleChange}
                      className="text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">Use Entry Fees as Prize Pool</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="prize_pool_option"
                      value="custom"
                      checked={formData.prize_pool_option === 'custom'}
                      onChange={handleChange}
                      className="text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">Custom Prize Pool</span>
                  </label>
                </div>
              </div>

              {/* Custom Prize Pool */}
              {formData.prize_pool_option === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Prize Pool (XP) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="custom_prize_pool"
                      value={formData.custom_prize_pool}
                      onChange={handleChange}
                      min="0"
                      step="10"
                      required={formData.prize_pool_option === 'custom'}
                      className="input-primary w-full pl-12"
                      placeholder="Enter custom prize pool amount"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      XP
                    </div>
                  </div>
                </div>
              )}

              {/* Prize Pool Summary */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-white">Prize Pool Summary</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Prize Pool:</span>
                    <span className="text-green-400 font-semibold">
                      {calculatePrizePool().toLocaleString()} XP
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Fee (15%):</span>
                    <span className="text-yellow-400">
                      {calculatePlatformFee().toLocaleString()} XP
                    </span>
                  </div>
                  
                  {formData.prize_pool_option === 'entry_fee' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Entry Fees:</span>
                      <span className="text-blue-400">
                        {(formData.entry_fee * formData.max_players).toLocaleString()} XP
                      </span>
                    </div>
                  )}
                  
                  {formData.type === 'squad' && selectedGroup && (
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Your Squad Entry:</span>
                      <span className="text-purple-400">
                        {formData.entry_fee > 0 ? `${formData.entry_fee} XP` : 'Free'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/tournaments')}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (formData.type === 'squad' && userGroups.length === 0)}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                'Create Tournament'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTournament