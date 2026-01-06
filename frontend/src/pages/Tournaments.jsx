import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Trophy, Users, Calendar, DollarSign, Plus, 
  Shield, Crown, Target, Filter, Search,
  Clock, Award
} from 'lucide-react'
import { tournamentsAPI } from '../utils/api'

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([])
  const [filteredTournaments, setFilteredTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchTournaments()
  }, [])

  useEffect(() => {
    filterTournaments()
  }, [searchQuery, typeFilter, statusFilter, tournaments])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const data = await tournamentsAPI.getAll()
      setTournaments(data.tournaments || [])
      setFilteredTournaments(data.tournaments || [])
    } catch (err) {
      setError('Failed to load tournaments')
      console.error('Error fetching tournaments:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterTournaments = () => {
    let filtered = tournaments

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.game.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    setFilteredTournaments(filtered)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'text-blue-400'
      case 'ongoing': return 'text-green-400'
      case 'completed': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getTournamentTypeIcon = (type) => {
    switch (type) {
      case '1v1': return <Target className="w-4 h-4" />
      case 'squad': return <Shield className="w-4 h-4" />
      case 'survival': return <Crown className="w-4 h-4" />
      case 'freeforall': return <Users className="w-4 h-4" />
      default: return <Trophy className="w-4 h-4" />
    }
  }

  const getTournamentTypeLabel = (type) => {
    switch (type) {
      case '1v1': return '1 vs 1'
      case 'squad': return 'Squad'
      case 'survival': return 'Survival'
      case 'freeforall': return 'Free for All'
      default: return type
    }
  }

  const getEntryFeeDisplay = (tournament) => {
    if (tournament.currency === 'xp') {
      return tournament.xp_entry_fee > 0 
        ? `${tournament.xp_entry_fee?.toLocaleString()} XP`
        : 'Free'
    }
    return tournament.entry_fee > 0 
      ? `₦${tournament.entry_fee?.toLocaleString()}`
      : 'Free'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tournaments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Tournaments</h1>
            <p className="text-gray-400">Compete and win XP prizes</p>
          </div>
          <Link
            to="/tournaments/create"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Tournament</span>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-primary w-full pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-primary w-full"
              >
                <option value="all">All Types</option>
                <option value="1v1">1 vs 1</option>
                <option value="squad">Squad</option>
                <option value="survival">Survival</option>
                <option value="freeforall">Free for All</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-primary w-full"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length === 0 ? (
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tournaments Found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try changing your search filters'
                : 'Be the first to create an amazing tournament!'
              }
            </p>
            <Link to="/tournaments/create" className="btn-primary">
              Create Tournament
            </Link>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400">
                Showing {filteredTournaments.length} of {tournaments.length} tournaments
              </p>
              <button
                onClick={fetchTournaments}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <div key={tournament.id} className="card hover:transform hover:scale-105 transition-all duration-300">
                  {/* Tournament Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTournamentTypeIcon(tournament.type)}
                        <span className="text-xs font-medium text-gray-400">
                          {getTournamentTypeLabel(tournament.type)}
                        </span>
                        {tournament.currency === 'xp' && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                            XP
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white truncate">
                        {tournament.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{tournament.game}</p>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(tournament.status)}`}>
                      {tournament.status?.charAt(0).toUpperCase() + tournament.status?.slice(1)}
                    </span>
                  </div>

                  {/* Tournament Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>
  {tournament.type === 'squad' 
    ? `${tournament.current_squads || 0}/${tournament.max_squads || tournament.max_groups || 8}`
    : `${tournament.current_players || 0}/${tournament.max_players}`
  }
</span>
                      </div>
                      <span className="text-white">
  {tournament.type === 'squad' 
    ? `${tournament.current_squads || 0}/${tournament.max_squads || 8}`
    : `${tournament.current_players || 0}/${tournament.max_players}`
  }
</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        <span>Prize Pool</span>
                      </div>
                      <span className="text-green-400 font-semibold">
                        {(tournament.prize_pool || 0).toLocaleString()} XP
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Starts</span>
                      </div>
                      <span className="text-white text-xs">
                        {formatDate(tournament.start_date)}
                      </span>
                    </div>

                    {tournament.type === 'squad' && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Shield className="w-4 h-4" />
                          <span>Squad Size</span>
                        </div>
                        <span className="text-white">1-5 players</span>
                      </div>
                    )}
                  </div>

                  {/* Entry Fee & Action */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <div>
                      <span className="text-sm text-gray-400">Entry: </span>
                      <span className="text-white font-semibold">
                        {getEntryFeeDisplay(tournament)}
                      </span>
                    </div>
                    <Link
                      to={`/tournaments/${tournament.id}`}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      View Details
                    </Link>
                  </div>

                  {/* Creator Info */}
                  {tournament.creator_name && (
                    <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                      <span>Created by: {tournament.creator_name}</span>
                      {tournament.winner_id && tournament.status === 'completed' && (
                        <span className="text-yellow-400 flex items-center">
                          <Award className="w-3 h-3 mr-1" />
                          Winner: #{tournament.winner_id}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Tournaments