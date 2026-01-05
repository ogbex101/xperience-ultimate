import React, { useState, useEffect } from 'react';
import { Trophy, Award, TrendingUp, User, Crown, Target, BarChart } from 'lucide-react';
import { tournamentsAPI } from '../utils/api';

const TournamentStandings = ({ tournamentId }) => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStandings();
  }, [tournamentId]);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await tournamentsAPI.getStandings(tournamentId);
      
      if (result.success) {
        setStandings(result.standings);
      } else {
        setError(result.error || 'Failed to load standings');
      }
    } catch (err) {
      console.error('Fetch standings error:', err);
      setError('Failed to load tournament standings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-400">Loading standings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStandings}
            className="mt-3 text-sm text-purple-400 hover:text-purple-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart className="w-8 h-8 text-gray-500" />
          </div>
          <h4 className="text-white font-medium mb-2">No Standings Yet</h4>
          <p className="text-gray-400">Tournament standings will appear after matches start.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-gradient rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Tournament Standings</h3>
            <p className="text-gray-400 text-sm">Live player rankings</p>
          </div>
        </div>
        <button
          onClick={fetchStandings}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Player</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Wins</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Losses</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Win Rate</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => (
              <tr 
                key={player.id} 
                className={`border-b border-gray-800 hover:bg-gray-800/50 ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    {index === 0 && <Crown className="w-5 h-5 text-yellow-400 mr-2" />}
                    {index === 1 && <Award className="w-5 h-5 text-gray-400 mr-2" />}
                    {index === 2 && <Award className="w-5 h-5 text-amber-700 mr-2" />}
                    <span className={`font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-amber-600' : 'text-gray-400'
                    }`}>
                      #{index + 1}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {player.profile_pic && player.profile_pic !== 'default.png' ? (
                        <img 
                          src={`/uploads/${player.profile_pic}`} 
                          alt={player.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{player.username}</div>
                      <div className="text-gray-400 text-sm">Matches: {player.matches_played || 0}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-green-400 font-semibold">{player.wins || 0}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-red-400">{player.losses || 0}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(player.win_rate || 0, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-300 font-medium">
                      {(player.win_rate || 0).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-800 text-gray-300">
                    {player.rank || 'E'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-gray-400 text-sm">Best Win Rate</div>
                <div className="text-white font-semibold">
                  {standings[0]?.win_rate?.toFixed(1) || '0'}%
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-gray-400 text-sm">Total Wins</div>
                <div className="text-white font-semibold">
                  {standings.reduce((sum, p) => sum + (p.wins || 0), 0)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-gray-400 text-sm">Active Players</div>
                <div className="text-white font-semibold">{standings.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentStandings;