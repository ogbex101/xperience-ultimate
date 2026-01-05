import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, Trophy, Users, Clock,
  Play, CheckCircle, XCircle, AlertTriangle,
  Award, Target, BarChart3, Crown
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const MatchesManagement = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGameType, setFilterGameType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [winnerId, setWinnerId] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ongoing: 0,
    completed: 0,
    totalStake: 0
  });

  useEffect(() => {
    loadMatches();
    loadStats();
  }, [currentPage, filterStatus, filterGameType]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getMatches(filterStatus, currentPage, 20);
      setMatches(response.matches || response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getMatchStats();
      if (response.stats) {
        setStats({
          total: response.stats.total || 0,
          pending: response.stats.pending || 0,
          ongoing: response.stats.ongoing || 0,
          completed: response.stats.completed || 0,
          totalStake: response.stats.totalStake || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadMatches();
  };

  const handleResolveDispute = async (matchId) => {
    try {
      const response = await adminAPI.resolveMatchDispute(matchId, winnerId, adminNotes);
      if (response?.success) {
        setShowResolveModal(false);
        setWinnerId('');
        setAdminNotes('');
        loadMatches();
        loadStats();
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  const handleCancelMatch = async (matchId) => {
    if (window.confirm('Are you sure you want to cancel this match?')) {
      try {
        const response = await adminAPI.cancelMatch(matchId, 'Cancelled by admin');
        if (response?.success) {
          loadMatches();
          loadStats();
        }
      } catch (error) {
        console.error('Error cancelling match:', error);
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'ongoing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    
    const icons = {
      'pending': <Clock className="w-3 h-3 mr-1" />,
      'ongoing': <Play className="w-3 h-3 mr-1" />,
      'completed': <CheckCircle className="w-3 h-3 mr-1" />
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${colors[status] || colors.pending}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const GameTypeBadge = ({ type }) => {
    const colors = {
      'individual': 'bg-purple-100 text-purple-800',
      'group': 'bg-blue-100 text-blue-800',
      'school': 'bg-green-100 text-green-800',
      'institution': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[type] || colors.individual}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Matches Management</h1>
        <p className="text-gray-300">Manage game matches, resolve disputes, and monitor match activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Matches</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
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

        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
              <Play className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Ongoing</p>
              <p className="text-2xl font-bold text-white">{stats.ongoing}</p>
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

        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Stake</p>
              <p className="text-2xl font-bold text-white">
                ${stats.totalStake.toLocaleString()}
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
                placeholder="Search by match ID, player names, or game..."
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
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Game Type Filter</label>
            <select
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterGameType}
              onChange={(e) => setFilterGameType(e.target.value)}
            >
              <option value="">All Game Types</option>
              <option value="individual">Individual</option>
              <option value="group">Group</option>
              <option value="school">School</option>
              <option value="institution">Institution</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Match Details</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Players</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stake & Prize</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Schedule</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    Loading matches...
                  </td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No matches found
                  </td>
                </tr>
              ) : (
                matches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-white">Match #{match.id}</div>
                      <div className="text-xs text-gray-400">{match.game || 'No game specified'}</div>
                      <GameTypeBadge type={match.game_type} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                          <span className="text-sm text-white">
                            Player 1: #{match.player1_id}
                            {match.winner_id === match.player1_id && (
                              <Crown className="inline w-3 h-3 ml-1 text-yellow-400" />
                            )}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-400 mr-2"></div>
                          <span className="text-sm text-white">
                            Player 2: {match.player2_id ? `#${match.player2_id}` : 'Waiting...'}
                            {match.winner_id === match.player2_id && (
                              <Crown className="inline w-3 h-3 ml-1 text-yellow-400" />
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="text-white">
                          Stake: ${parseFloat(match.stake_amount).toLocaleString()}
                        </div>
                        <div className="text-green-400">
                          Prize: ${parseFloat(match.prize_pool_amount || match.custom_prize_pool || 0).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={match.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {match.scheduled_at ? (
                        <>
                          <div>{new Date(match.scheduled_at).toLocaleDateString()}</div>
                          <div className="text-xs">
                            {new Date(match.scheduled_at).toLocaleTimeString()}
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
                            setSelectedMatch(match);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {match.status === 'ongoing' && !match.winner_id && (
                          <button
                            onClick={() => {
                              setSelectedMatch(match);
                              setShowResolveModal(true);
                            }}
                            className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                            title="Resolve Dispute"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(match.status === 'pending' || match.status === 'ongoing') && (
                          <button
                            onClick={() => handleCancelMatch(match.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Cancel Match"
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

      {/* Match Details Modal */}
      {showDetailsModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Match Details #{selectedMatch.id}</h3>
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
                    <label className="block text-sm font-medium text-gray-400 mb-1">Game</label>
                    <div className="text-white">{selectedMatch.game || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Game Type</label>
                    <GameTypeBadge type={selectedMatch.game_type} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <StatusBadge status={selectedMatch.status} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Stake Amount</label>
                    <div className="text-white text-xl font-bold">
                      ${parseFloat(selectedMatch.stake_amount).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Prize Pool</label>
                    <div className="text-green-400 text-xl font-bold">
                      ${parseFloat(selectedMatch.prize_pool_amount || selectedMatch.custom_prize_pool || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Prize Pool Option</label>
                    <div className="text-white">{selectedMatch.prize_pool_option}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
                    <div className="text-white">
                      {new Date(selectedMatch.created_at).toLocaleString()}
                    </div>
                  </div>
                  {selectedMatch.completed_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Completed At</label>
                      <div className="text-white">
                        {new Date(selectedMatch.completed_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">Players Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2">Player 1</h5>
                    <div className="text-sm text-gray-300">ID: #{selectedMatch.player1_id}</div>
                    {selectedMatch.winner_id === selectedMatch.player1_id && (
                      <div className="mt-2 inline-flex items-center px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                        <Trophy className="w-3 h-3 mr-1" /> Winner
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2">Player 2</h5>
                    <div className="text-sm text-gray-300">
                      ID: {selectedMatch.player2_id ? `#${selectedMatch.player2_id}` : 'Not assigned'}
                    </div>
                    {selectedMatch.winner_id === selectedMatch.player2_id && (
                      <div className="mt-2 inline-flex items-center px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                        <Trophy className="w-3 h-3 mr-1" /> Winner
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedMatch.scheduled_at && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-2">Schedule</h4>
                  <div className="text-gray-300">
                    Scheduled for: {new Date(selectedMatch.scheduled_at).toLocaleString()}
                  </div>
                  {selectedMatch.started_at && (
                    <div className="text-gray-300 mt-2">
                      Started at: {new Date(selectedMatch.started_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-end space-x-3">
                  {selectedMatch.status === 'ongoing' && !selectedMatch.winner_id && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowResolveModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700"
                    >
                      Resolve Dispute
                    </button>
                  )}
                  {(selectedMatch.status === 'pending' || selectedMatch.status === 'ongoing') && (
                    <button
                      onClick={() => {
                        handleCancelMatch(selectedMatch.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700"
                    >
                      Cancel Match
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

      {/* Resolve Dispute Modal */}
      {showResolveModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Resolve Match Dispute</h3>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-4">Select the winner for Match #{selectedMatch.id}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="player1"
                      name="winner"
                      value={selectedMatch.player1_id}
                      checked={winnerId === selectedMatch.player1_id.toString()}
                      onChange={(e) => setWinnerId(e.target.value)}
                      className="mr-3"
                    />
                    <label htmlFor="player1" className="text-white">
                      Player 1 (ID: #{selectedMatch.player1_id})
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="player2"
                      name="winner"
                      value={selectedMatch.player2_id}
                      checked={winnerId === selectedMatch.player2_id?.toString()}
                      onChange={(e) => setWinnerId(e.target.value)}
                      className="mr-3"
                    />
                    <label htmlFor="player2" className="text-white">
                      Player 2 {selectedMatch.player2_id ? `(ID: #${selectedMatch.player2_id})` : 'Not assigned'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Admin Notes (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter notes about this resolution..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setWinnerId('');
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResolveDispute(selectedMatch.id)}
                  disabled={!winnerId || (selectedMatch.player2_id && winnerId !== selectedMatch.player2_id?.toString() && winnerId !== selectedMatch.player1_id.toString())}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resolve Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesManagement;