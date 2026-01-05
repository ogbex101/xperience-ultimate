import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { tournamentsAPI } from '../utils/api'
import TournamentBracket from './TournamentBracket'
import SquadRegistrationModal from '../components/SquadRegistrationModal';
import { useAuth } from '../contexts/AuthContext'
import { 
  Trophy, Users, Calendar, DollarSign, ArrowLeft, 
  Clock, User, Award, Swords, AlertCircle, Loader,
  Shield, Crown, Target, CheckCircle, XCircle, 
  ChevronRight, Map, BarChart3
} from 'lucide-react'

const TournamentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [tournament, setTournament] = useState(null)
  const [participants, setParticipants] = useState([])
  const [squads, setSquads] = useState([])
  const [userGroups, setUserGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingSquads, setLoadingSquads] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [apiError, setApiError] = useState('')
  const [showSquadModal, setShowSquadModal] = useState(false)
  const [xpBalance, setXpBalance] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchTournamentDetails()
    if (user) {
      fetchUserGroups()
      fetchUserXP()
    }
  }, [id, user])

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true)
      setError('')
      setApiError('')
      
      console.log('🔍 Fetching tournament ID:', id)
      
      const data = await tournamentsAPI.getById(id)
      console.log('✅ API function success:', data)
      
      if (data && data.success) {
        setTournament(data.tournament)
        setParticipants(data.participants || [])
        console.log('✅ Tournament set:', data.tournament?.name)
        
        // Fetch squads if squad tournament
        if (data.tournament?.type === 'squad') {
          fetchSquads()
        }
      } else {
        setError(data?.error || 'Failed to load tournament details')
        console.error('❌ API returned error:', data?.error)
      }
    } catch (err) {
      console.error('❌ Fetch error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response?.data
      })
      
      setApiError(err.message || 'Failed to load tournament details')
    } finally {
      setLoading(false)
      console.log('✅ Loading set to false')
    }
  }

  const fetchSquads = async () => {
    try {
      setLoadingSquads(true)
      const response = await tournamentsAPI.getSquads(id)
      if (response.success) {
        setSquads(response.squads || [])
      }
    } catch (error) {
      console.error('Error fetching squads:', error)
    } finally {
      setLoadingSquads(false)
    }
  }

  const fetchUserGroups = async () => {
    try {
      setLoadingGroups(true)
      const response = await tournamentsAPI.getUserGroups()
      if (response.success) {
        setUserGroups(response.groups || [])
      }
    } catch (error) {
      console.error('Error fetching user groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const fetchUserXP = async () => {
    try {
      const response = await tournamentsAPI.getUserProfile()
      if (response.success && response.data) {
        setXpBalance(response.data.xp_points || 0)
      }
    } catch (error) {
      console.error('Error fetching user XP:', error)
    }
  }

  const handleJoinTournament = async (groupData = null) => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      setJoining(true)
      setError('')
      
      let result
      if (tournament.type === 'squad' && groupData) {
        // Join squad tournament with group
        result = await tournamentsAPI.join(id, groupData)
      } else {
        // Join regular tournament
        result = await tournamentsAPI.join(id)
      }
      
      if (result.success) {
        setSuccess(tournament.type === 'squad' 
          ? 'Squad registered successfully!' 
          : 'Successfully joined tournament!'
        )
        // Refresh tournament details
        fetchTournamentDetails()
        // Refresh user XP balance
        fetchUserXP()
      } else {
        setError(result.error || 'Failed to join tournament')
      }
    } catch (err) {
      console.error('Join error:', err)
      setError(err.response?.data?.error || 'Failed to join tournament')
    } finally {
      setJoining(false)
    }
  }

  const validateGroupForTournament = async (groupId) => {
    try {
      const response = await tournamentsAPI.validateGroup(id, { group_id: groupId })
      return response
    } catch (error) {
      console.error('Validation error:', error)
      return { eligible: false, message: 'Validation failed' }
    }
  }

  const isUserParticipant = () => {
    return participants.some(p => p.user_id === user?.id)
  }

  const getUserGroupInTournament = () => {
    if (!user || tournament.type !== 'squad') return null
    const userParticipant = participants.find(p => p.user_id === user.id)
    return userParticipant?.group_id || null
  }

  const isTournamentFull = () => {
    if (tournament.type === 'squad') {
      return squads.length >= (tournament.max_squads || 8)
    }
    return participants.length >= (tournament?.max_players || 0)
  }

  const canJoinTournament = () => {
    if (!user || !tournament) return false
    
    // Check tournament status
    if (tournament.status !== 'upcoming') return false
    
    // Check if full
    if (isTournamentFull()) return false
    
    // Check if already joined
    if (isUserParticipant()) return false
    
    // Squad tournament specific checks
    if (tournament.type === 'squad') {
      // User must have admin groups available
      if (userGroups.length === 0) return false
      
      // Check if any of user's groups are already in tournament
      const userGroupIds = userGroups.map(g => g.id)
      const tournamentGroupIds = squads.map(s => s.group_id)
      const availableGroups = userGroups.filter(g => !tournamentGroupIds.includes(g.id))
      
      return availableGroups.length > 0
    }
    
    return true
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Upcoming' },
      ongoing: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Ongoing' },
      completed: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Completed' },
      cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelled' }
    }
    
    const config = statusConfig[status] || statusConfig.upcoming
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getTournamentTypeIcon = (type) => {
    switch (type) {
      case '1v1': return <Target className="w-4 h-4" />
      case 'squad': return <Shield className="w-4 h-4" />
      case 'survival': return <Crown className="w-4 h-4" />
      case 'freeforall': return <Users className="w-4 h-4" />
      default: return <Swords className="w-4 h-4" />
    }
  }

  const getTournamentTypeLabel = (type) => {
    switch (type) {
      case '1v1': return '1 vs 1 Tournament'
      case 'squad': return 'Squad Tournament'
      case 'survival': return 'Survival of the Fittest'
      case 'freeforall': return 'Free for All'
      default: return type
    }
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Tournament...</h3>
          <p className="text-gray-400">Fetching tournament details</p>
          <p className="text-gray-500 text-sm mt-2">Tournament ID: {id}</p>
        </div>
      </div>
    )
  }

  // Handle API errors
  if (apiError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Tournament</h3>
          <p className="text-gray-400 mb-4">{apiError}</p>
          <div className="space-y-3">
            <button
              onClick={fetchTournamentDetails}
              className="btn-primary w-full"
            >
              <Loader className="w-4 h-4 inline mr-2 animate-spin" />
              Retry Loading
            </button>
            <button
              onClick={() => navigate('/tournaments')}
              className="btn-secondary w-full"
            >
              Back to Tournaments
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Handle tournament not found
  if (!tournament && !loading && !apiError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Tournament Not Found</h3>
          <p className="text-gray-400 mb-6">The tournament you're looking for doesn't exist.</p>
          <Link to="/tournaments" className="btn-primary">
            Back to Tournaments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/tournaments')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Tournaments</span>
            </button>
          </div>
          {getStatusBadge(tournament.status)}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tournament Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center space-x-2 text-purple-400">
                  {getTournamentTypeIcon(tournament.type)}
                  <span className="text-sm font-medium">{getTournamentTypeLabel(tournament.type)}</span>
                </div>
                {tournament.currency === 'xp' && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    XP Tournament
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {tournament.name || 'Unnamed Tournament'}
              </h1>
              <p className="text-gray-400 text-lg">{tournament.game || 'Unknown Game'}</p>
            </div>
            <div className="w-20 h-20 bg-purple-gradient rounded-xl flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>

          {tournament.description && (
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
              <p className="text-gray-300">{tournament.description}</p>
            </div>
          )}

          {/* Tournament Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-6 border-y border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  {tournament.type === 'squad' ? 'Squads' : 'Players'}
                </span>
              </div>
              <div className="text-white font-semibold text-xl">
                {tournament.type === 'squad' 
                  ? `${squads.length}/${tournament.max_squads || 8}`
                  : `${participants.length}/${tournament.max_players || 0}`
                }
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-400 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Prize Pool</span>
              </div>
              <div className="text-green-400 font-semibold text-xl">
                {(tournament.prize_pool || 0).toLocaleString()} XP
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Starts</span>
              </div>
              <div className="text-white text-sm">
                {formatDate(tournament.start_date)}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-400 mb-1">
                <Swords className="w-4 h-4" />
                <span className="text-sm">Entry Fee</span>
              </div>
              <div className="text-white font-semibold text-lg">
                {(tournament.xp_entry_fee || 0) > 0 
                  ? `${(tournament.xp_entry_fee || 0).toLocaleString()} XP`
                  : 'Free'
                }
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-400 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-sm">Creator</span>
              </div>
              <div className="text-white text-sm truncate">
                {tournament.creator_name || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6">
            <div className="flex items-center space-x-2">
              {tournament.type === 'squad' && tournament.squad_name && (
                <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg text-sm">
                  Squad: {tournament.squad_name}
                </div>
              )}
              {getUserGroupInTournament() && (
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm">
                  Your Squad Registered ✓
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* XP Balance Display */}
              {user && (
                <div className="text-right mr-4">
                  <div className="text-sm text-gray-400">Your XP</div>
                  <div className="text-lg font-bold text-green-400">{xpBalance.toLocaleString()} XP</div>
                </div>
              )}

              {canJoinTournament() && tournament.type === 'squad' && (
                <button
                  onClick={() => setShowSquadModal(true)}
                  disabled={joining}
                  className="btn-primary flex items-center space-x-2"
                >
                  {joining ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Register Squad</span>
                    </>
                  )}
                </button>
              )}

              {canJoinTournament() && tournament.type !== 'squad' && (
                <button
                  onClick={() => handleJoinTournament()}
                  disabled={joining}
                  className="btn-primary"
                >
                  {joining ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Joining...
                    </>
                  ) : (
                    'Join Tournament'
                  )}
                </button>
              )}

              {isUserParticipant() && (
                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Already Joined</span>
                </div>
              )}

              {isTournamentFull() && (
                <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg flex items-center space-x-2">
                  <XCircle className="w-5 h-5" />
                  <span>Tournament Full</span>
                </div>
              )}

              {!user && (
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary"
                >
                  Login to Join
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'participants'
                ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>
                {tournament.type === 'squad' ? 'Squads' : 'Participants'} 
                ({tournament.type === 'squad' ? squads.length : participants.length})
              </span>
            </div>
          </button>
          
          {tournament.type === '1v1' && (
            <button
              onClick={() => setActiveTab('bracket')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'bracket'
                  ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Map className="w-4 h-4" />
                <span>Bracket</span>
              </div>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Tournament Rules */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Tournament Rules</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Must have stable internet connection</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>No cheating or unfair advantages</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Be respectful to other players</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Follow the game's official rules</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Tournament admin decisions are final</span>
                    </li>
                    {tournament.type === 'squad' && (
                      <li className="flex items-start space-x-2">
                        <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>Group admins must register their squads</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Additional Info */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform Fee:</span>
                      <span className="text-yellow-400">
                        {(tournament.platform_fee || 0).toLocaleString()} XP
                      </span>
                    </div>
                    
                    {tournament.prize_pool_option && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Prize Type:</span>
                        <span className="text-white capitalize">
                          {(tournament.prize_pool_option || '').replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    
                    {tournament.created_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">
                          {formatDate(tournament.created_at)}
                        </span>
                      </div>
                    )}
                    
                    {tournament.type === 'squad' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Max Squads:</span>
                          <span className="text-white">{tournament.max_squads || 8}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Players per Squad:</span>
                          <span className="text-white">1-5</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Tournament Type:</span>
                      <div className="flex items-center space-x-2">
                        {getTournamentTypeIcon(tournament.type)}
                        <span className="text-white">{getTournamentTypeLabel(tournament.type)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Currency:</span>
                      <span className="text-green-400">XP Points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      {getStatusBadge(tournament.status)}
                    </div>
                    {tournament.winner_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Winner:</span>
                        <span className="text-yellow-400">#{tournament.winner_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Tournament Button (Creator Only) */}
                {user?.id === tournament.creator_id && tournament.status === 'upcoming' && (
                  <div className="card bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <h3 className="text-lg font-semibold text-white mb-3">Tournament Control</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      You can start the tournament when enough players have joined.
                    </p>
                    <button
                      onClick={() => tournamentsAPI.start(id)}
                      className="btn-primary w-full"
                      disabled={participants.length < 2}
                    >
                      Start Tournament
                    </button>
                    {participants.length < 2 && (
                      <p className="text-xs text-yellow-400 mt-2 text-center">
                        Need at least 2 participants to start
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants/Squads Tab */}
          {activeTab === 'participants' && (
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>
                  {tournament.type === 'squad' ? 'Registered Squads' : 'Participants'} 
                  ({tournament.type === 'squad' ? squads.length : participants.length})
                </span>
              </h3>
              
              {tournament.type === 'squad' ? (
                /* Squads Display */
                loadingSquads ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading squads...</p>
                  </div>
                ) : squads.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">No Squads Registered Yet</h4>
                    <p className="text-gray-400 mb-4">
                      Be the first group to register for this tournament!
                    </p>
                    {canJoinTournament() && (
                      <button
                        onClick={() => setShowSquadModal(true)}
                        className="btn-primary"
                      >
                        Register Your Squad
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {squads.map((squad, index) => (
                      <div key={squad.group_id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-white text-lg">
                              {squad.group_name}
                              {squad.squad_name && (
                                <span className="text-purple-400 ml-2">- {squad.squad_name}</span>
                              )}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                                #{index + 1}
                              </span>
                              <span className="text-xs text-gray-400">
                                Registered {new Date(squad.registered_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                            {squad.squad_size}/5 players
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-400 mb-1">Members:</h5>
                          <p className="text-sm text-gray-300">{squad.members}</p>
                        </div>
                        
                        {getUserGroupInTournament() === squad.group_id && (
                          <div className="flex items-center space-x-2 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>Your Squad</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Individual Participants Display */
                participants.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">No Participants Yet</h4>
                    <p className="text-gray-400">Be the first to join this tournament!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant, index) => (
                      <div key={participant.user_id || index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium">
                                {participant.username || `Player ${participant.user_id}`}
                              </span>
                              {participant.user_id === tournament.creator_id && (
                                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded">
                                  Creator
                                </span>
                              )}
                              {participant.user_id === user?.id && (
                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                              {participant.rank && (
                                <span className="bg-gray-700 px-2 py-0.5 rounded">
                                  Rank: {participant.rank}
                                </span>
                              )}
                              <span>Win Rate: {participant.win_rate || 0}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {participant.group_id && (
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Group</div>
                            <div className="text-sm text-purple-400">#{participant.group_id}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* Bracket Tab (1v1 Tournaments Only) */}
          {activeTab === 'bracket' && tournament.type === '1v1' && (
            <TournamentBracket
              tournamentId={tournament.id}
              tournamentType={tournament.type}
              isCreator={user?.id === tournament.creator_id}
              currentUserId={user?.id}
              currentUser={user}
              onTournamentStarted={fetchTournamentDetails}
            />
          )}
        </div>
      </div>

      {/* Squad Registration Modal */}
      {showSquadModal && (
        <SquadRegistrationModal
          tournament={tournament}
          userGroups={userGroups}
          userXP={xpBalance}
          onClose={() => setShowSquadModal(false)}
          onJoin={handleJoinTournament}
          onValidate={validateGroupForTournament}
        />
      )}
    </div>
  )
}

export default TournamentDetails