import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, Trophy, Users, Clock,
  Play, CheckCircle, XCircle, AlertTriangle,
  Award, Target, BarChart3, Crown, Calendar,
  DollarSign, Settings, RefreshCw, UserX
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const TournamentsManagement = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    totalPrizePool: 0
  });

  useEffect(() => {
    loadTournaments();
    loadStats();
  }, [currentPage, filterStatus, filterType]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTournaments(filterStatus, currentPage, 20);
      setTournaments(response.tournaments || response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      if (response.stats) {
        setStats({
          total: response.stats.totalTournaments || 0,
          upcoming: response.stats.upcomingTournaments || 0,
          ongoing: response.stats.ongoingTournaments || 0,
          completed: response.stats.completedTournaments || 0,
          cancelled: response.stats.cancelledTournaments || 0,
          totalPrizePool: response.stats.totalPrizePool || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadTournaments();
  };

  const loadParticipants = async (tournamentId) => {
    try {
      const response = await adminAPI.getTournamentParticipants(tournamentId);
      setParticipants(response.participants || response.data || []);
      setShowParticipantsModal(true);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleCancelTournament = async (tournamentId) => {
    if (window.confirm('Are you sure you want to cancel this tournament? All entry fees will be refunded.')) {
      try {
        const response = await adminAPI.cancelTournament(tournamentId, 'Cancelled by admin');
        if (response?.success) {
          loadTournaments();
          loadStats();
        }
      } catch (error) {
        console.error('Error cancelling tournament:', error);
      }
    }
  };

  const handleDistributePrizes = async (tournamentId) => {
    if (window.confirm('Distribute prizes to winners? This action cannot be undone.')) {
      try {
        const response = await adminAPI.distributeTournamentPrizes(tournamentId);
        if (response?.success) {
          setShowPrizeModal(false);
          loadTournaments();
          loadStats();
        }
      } catch (error) {
        console.error('Error distributing prizes:', error);
      }
    }
  };

  const handleRemoveParticipant = async (tournamentId, userId) => {
    if (window.confirm('Remove this participant from the tournament?')) {
      try {
        const response = await adminAPI.removeTournamentParticipant(tournamentId, userId, 'Removed by admin');
        if (response?.success) {
          loadParticipants(tournamentId);
        }
      } catch (error) {
        console.error('Error removing participant:', error);
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      'upcoming': 'bg-blue-100 text-blue-800',
      'ongoing': 'bg-green-100 text-green-800',
      'completed': 'bg-purple-100 text-purple-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    const icons = {
      'upcoming': <Clock className="w-3 h-3 mr-1" />,
      'ongoing': <Play className="w-3 h-3 mr-1" />,
      'completed': <CheckCircle className="w-3 h-3 mr-1" />,
      'cancelled': <XCircle className="w-3 h-3 mr-1" />
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${colors[status] || colors.upcoming}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const TypeBadge = ({ type }) => {
    const colors = {
      'versus': 'bg-blue-100 text-blue-800',
      'survival': 'bg-red-100 text-red-800',
      'freeforall': 'bg-yellow-100 text-yellow-800',
      'squad': 'bg-green-100 text-green-800',
      'onevsone': 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      'versus': 'Versus',
      'survival': 'Survival',
      'freeforall': 'Free-for-All',
      'squad': 'Squad',
      'onevsone': '1v1'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[type] || colors.versus}`}>
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Tournaments Management</h1>
        <p className="text-gray-300">Manage tournaments, distribute prizes, and oversee tournament operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
              <Trophy className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Upcoming</p>
              <p className="text-2xl font-bold text-white">{stats.upcoming}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/20 mr-3">
              <Play className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Ongoing</p>
              <p className="text-2xl font-bold text-white">{stats.ongoing}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
              <CheckCircle className="w-6 h-6 text-purple-400" />
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
              <p className="text-sm text-gray-300">Cancelled</p>
              <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500/20 mr-3">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Prize Pool</p>
              <p className="text-2xl font-bold text-white">
                ${stats.totalPrizePool.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by tournament name, game, or ID..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status Filter</label>
            <select
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Type Filter</label>
            <select
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="versus">Versus</option>
              <option value="survival">Survival</option>
              <option value="freeforall">Free-for-All</option>
              <option value="squad">Squad</option>
              <option value="onevsone">1v1</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournaments Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tournament Details</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Game & Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Participants</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Prize Pool</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Schedule</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    Loading tournaments...
                  </td>
                </tr>
              ) : tournaments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    No tournaments found
                  </td>
                </tr>
              ) : (
                tournaments.map((tournament) => (
                  <tr key={tournament.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-white">{tournament.name}</div>
                      <div className="text-xs text-gray-400">ID: #{tournament.id}</div>
                      {tournament.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {tournament.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-white">{tournament.game}</div>
                      <TypeBadge type={tournament.type} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-white">
                          {tournament.current_participants || 0}/{tournament.max_players}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Entry: ${parseFloat(tournament.entry_fee || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-yellow-400">
                        ${parseFloat(tournament.prize_pool || tournament.custom_prize_pool || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {tournament.prize_pool_option === 'custom' ? 'Custom' : 'Entry Fee'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tournament.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {tournament.start_date ? (
                        <>
                          <div>{new Date(tournament.start_date).toLocaleDateString()}</div>
                          <div className="text-xs">
                            {new Date(tournament.start_date).toLocaleTimeString()}
                          </div>
                        </>
                      ) : (
                        'Not scheduled'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTournament(tournament);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => loadParticipants(tournament.id)}
                          className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="View Participants"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        
                        {tournament.status === 'ongoing' && (
                          <button
                            onClick={() => {
                              setSelectedTournament(tournament);
                              setShowPrizeModal(true);
                            }}
                            className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                            title="Distribute Prizes"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        )}
                        
                        {tournament.status === 'upcoming' && (
                          <button
                            onClick={() => handleCancelTournament(tournament.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Cancel Tournament"
                          >
                            <XCircle className="w-4 h-4" />
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
                Page {currentPage} of {totalPages}
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

      {/* Tournament Details Modal */}
      {showDetailsModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{selectedTournament.name}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tournament ID</label>
                    <div className="text-white">#{selectedTournament.id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Game</label>
                    <div className="text-white">{selectedTournament.game}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                    <TypeBadge type={selectedTournament.type} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <StatusBadge status={selectedTournament.status} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Creator</label>
                    <div className="text-white">User #{selectedTournament.creator_id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Entry Fee</label>
                    <div className="text-white">
                      ${parseFloat(selectedTournament.entry_fee || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Prize Pool</label>
                    <div className="text-yellow-400 text-xl font-bold">
                      ${parseFloat(selectedTournament.prize_pool || selectedTournament.custom_prize_pool || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Platform Fee</label>
                    <div className="text-white">
                      ${parseFloat(selectedTournament.platform_fee || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {selectedTournament.description && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                  <p className="text-gray-300">{selectedTournament.description}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">Participant Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Max Players</div>
                    <div className="text-xl font-bold text-white">{selectedTournament.max_players}</div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Min Players</div>
                    <div className="text-xl font-bold text-white">{selectedTournament.min_players || 2}</div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Current</div>
                    <div className="text-xl font-bold text-green-400">
                      {selectedTournament.current_participants || 0}
                    </div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Team Based</div>
                    <div className="text-xl font-bold text-white">
                      {selectedTournament.team_based ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-2">Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Start Date</div>
                    <div className="text-white">
                      {selectedTournament.start_date 
                        ? new Date(selectedTournament.start_date).toLocaleString()
                        : 'Not scheduled'}
                    </div>
                  </div>
                  {selectedTournament.completed_at && (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Completed At</div>
                      <div className="text-white">
                        {new Date(selectedTournament.completed_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedTournament.winner_id && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">Winner</h4>
                  <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 rounded-lg p-4">
                    <div className="flex items-center">
                      <Crown className="w-6 h-6 text-yellow-400 mr-3" />
                      <div>
                        <div className="text-white font-medium">User #{selectedTournament.winner_id}</div>
                        <div className="text-sm text-gray-300">Tournament Champion</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => loadParticipants(selectedTournament.id)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700"
                  >
                    View Participants
                  </button>
                  {selectedTournament.status === 'ongoing' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowPrizeModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700"
                    >
                      Distribute Prizes
                    </button>
                  )}
                  {selectedTournament.status === 'upcoming' && (
                    <button
                      onClick={() => {
                        handleCancelTournament(selectedTournament.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700"
                    >
                      Cancel Tournament
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribute Prizes Modal */}
      {showPrizeModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Distribute Prizes</h3>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  Distribute prizes for tournament: <span className="text-white font-medium">{selectedTournament.name}</span>
                </p>
                <p className="text-gray-300 mb-4">
                  Total Prize Pool: <span className="text-yellow-400 font-bold">
                    ${parseFloat(selectedTournament.prize_pool || selectedTournament.custom_prize_pool || 0).toLocaleString()}
                  </span>
                </p>
                
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-300">
                    This will automatically distribute prizes to tournament winners based on their standings.
                    Make sure all matches are completed before distributing prizes.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPrizeModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDistributePrizes(selectedTournament.id)}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700"
                >
                  Distribute Prizes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Participants - {selectedTournament?.name || 'Tournament'}
                </h3>
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No participants found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {participants.map((participant) => (
                        <tr key={participant.user_id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium text-white">User #{participant.user_id}</div>
                            <div className="text-xs text-gray-400">{participant.username || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              participant.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {participant.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">
                            {participant.joined_at 
                              ? new Date(participant.joined_at).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleRemoveParticipant(selectedTournament.id, participant.user_id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Remove Participant"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentsManagement;