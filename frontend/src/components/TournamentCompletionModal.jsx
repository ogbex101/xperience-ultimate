import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, Users, CheckCircle, X, Loader, 
  Crown, Flame, Shield, Infinity, Settings, Percent
} from 'lucide-react';
import { tournamentsAPI } from '../utils/api';

const TournamentCompletionModal = ({ tournament, onClose, onComplete }) => {
  const [participants, setParticipants] = useState([]);
  const [winners, setWinners] = useState({
    first: '',
    second: '',
    third: ''
  });
  const [distribution, setDistribution] = useState({
    firstPercent: 70,
    secondPercent: 20,
    thirdPercent: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [requiredWinners, setRequiredWinners] = useState(1); // 1, 2, or 3

  useEffect(() => {
    fetchParticipants();
    setupDefaultDistribution();
  }, [tournament.id, tournament.type]);

  const setupDefaultDistribution = () => {
    // For Survival tournaments, require 3 winners
    if (tournament.type === 'survival') {
      setRequiredWinners(3);
      setDistribution({
        firstPercent: 70,
        secondPercent: 20,
        thirdPercent: 10
      });
    } else {
      // For other tournaments, default to 1 winner (with option for more)
      setRequiredWinners(1);
      setDistribution({
        firstPercent: 100,
        secondPercent: 0,
        thirdPercent: 0
      });
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await tournamentsAPI.getById(tournament.id);
      if (response.success) {
        setParticipants(response.participants || []);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleWinnerChange = (position, value) => {
    setWinners(prev => ({
      ...prev,
      [position]: value
    }));
  };

  const handleDistributionChange = (position, value) => {
    const numValue = parseInt(value) || 0;
    
    setDistribution(prev => {
      const newDist = { ...prev };
      newDist[position] = numValue;
      
      // Rebalance to ensure total is 100%
      const total = Object.values(newDist).reduce((sum, val) => sum + val, 0);
      if (total !== 100) {
        // Adjust the largest percentage to make total 100%
        const largestKey = Object.keys(newDist).reduce((a, b) => 
          newDist[a] > newDist[b] ? a : b
        );
        newDist[largestKey] += (100 - total);
      }
      
      return newDist;
    });
  };

  const calculatePrizeAmount = (percentage) => {
    if (!tournament.prize_pool || tournament.prize_pool <= 0) return 0;
    return Math.floor(tournament.prize_pool * (percentage / 100));
  };

  const validateForm = () => {
    // Check first winner is selected
    if (!winners.first) {
      setError('First place winner is required');
      return false;
    }

    // For Survival tournaments, require all 3 winners
    if (tournament.type === 'survival') {
      if (!winners.second || !winners.third) {
        setError('Survival tournaments require all 3 winners (1st, 2nd, 3rd place)');
        return false;
      }
    }

    // Check for duplicate winners
    const winnerIds = Object.values(winners).filter(id => id !== '');
    const uniqueIds = new Set(winnerIds);
    if (winnerIds.length !== uniqueIds.size) {
      setError('Each winner must be a different participant');
      return false;
    }

    // Check distribution total is 100%
    const totalPercent = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    if (totalPercent !== 100) {
      setError('Prize distribution must total 100%');
      return false;
    }

    return true;
  };

  const handleCompleteTournament = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await tournamentsAPI.completeWithWinner(tournament.id, {
        winner_id: parseInt(winners.first),
        runner_up_id: winners.second ? parseInt(winners.second) : null,
        third_place_id: winners.third ? parseInt(winners.third) : null,
        // For Survival tournaments, include title requirements
        title_requirements: tournament.type === 'survival' ? {
          boundless: tournament.title_requirements_boundless || 'Boundless Explorer',
          chaos: tournament.title_requirements_chaos || 'Master of Chaos',
          order: tournament.title_requirements_order || 'Grand Master of Order'
        } : null
      });

      if (result.success) {
        setSuccess('Tournament completed successfully!');
        setTimeout(() => {
          onComplete(result.tournament);
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to complete tournament');
      }
    } catch (error) {
      setError('Failed to complete tournament: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter participants for dropdowns
  const getAvailableParticipants = (excludeIds = []) => {
    return participants.filter(p => 
      !excludeIds.includes(p.user_id.toString())
    );
  };

  // Get title for winner position
  const getWinnerTitle = (position) => {
    if (tournament.type === 'survival') {
      const titles = {
        first: tournament.title_requirements_boundless || 'Boundless Explorer',
        second: tournament.title_requirements_order || 'Grand Master of Order',
        third: tournament.title_requirements_chaos || 'Master of Chaos'
      };
      return titles[position];
    }
    
    const defaultTitles = {
      first: 'Champion',
      second: 'Runner-up',
      third: 'Third Place'
    };
    return defaultTitles[position];
  };

  // Get icon for winner position
  const getWinnerIcon = (position) => {
    if (tournament.type === 'survival') {
      const icons = {
        first: <Infinity className="w-4 h-4 text-purple-400" />,
        second: <Shield className="w-4 h-4 text-blue-400" />,
        third: <Flame className="w-4 h-4 text-red-400" />
      };
      return icons[position];
    }
    
    const defaultIcons = {
      first: <Trophy className="w-4 h-4 text-yellow-400" />,
      second: <Award className="w-4 h-4 text-gray-400" />,
      third: <Award className="w-4 h-4 text-amber-600" />
    };
    return defaultIcons[position];
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              tournament.type === 'survival' 
                ? 'bg-purple-500/20' 
                : 'bg-yellow-500/20'
            }`}>
              {tournament.type === 'survival' ? (
                <Crown className="w-6 h-6 text-purple-400" />
              ) : (
                <Trophy className="w-6 h-6 text-yellow-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {tournament.type === 'survival' ? 'Complete Survival Tournament' : 'Complete Tournament'}
              </h2>
              <p className="text-sm text-gray-400">{tournament.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
              title="Distribution Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tournament Type Info */}
          {tournament.type === 'survival' && (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white">Survival of the Fittest</h3>
                  <p className="text-sm text-gray-300">
                    Special titles will be awarded to all 3 winners
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 space-y-4">
              <h3 className="font-semibold text-white flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Prize Distribution Settings</span>
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Winners
                </label>
                <div className="flex space-x-3">
                  {[1, 2, 3].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setRequiredWinners(num);
                        if (num === 1) {
                          setDistribution({ firstPercent: 100, secondPercent: 0, thirdPercent: 0 });
                        } else if (num === 2) {
                          setDistribution({ firstPercent: 70, secondPercent: 30, thirdPercent: 0 });
                        } else {
                          setDistribution({ firstPercent: 70, secondPercent: 20, thirdPercent: 10 });
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg transition-colors ${
                        requiredWinners === num
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {num} Winner{num > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">1st Place</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={distribution.firstPercent}
                      onChange={(e) => handleDistributionChange('firstPercent', e.target.value)}
                      className="w-32"
                      disabled={requiredWinners < 1}
                    />
                    <span className="w-12 text-right">{distribution.firstPercent}%</span>
                  </div>
                </div>

                {requiredWinners >= 2 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">2nd Place</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={distribution.secondPercent}
                        onChange={(e) => handleDistributionChange('secondPercent', e.target.value)}
                        className="w-32"
                      />
                      <span className="w-12 text-right">{distribution.secondPercent}%</span>
                    </div>
                  </div>
                )}

                {requiredWinners >= 3 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">3rd Place</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={distribution.thirdPercent}
                        onChange={(e) => handleDistributionChange('thirdPercent', e.target.value)}
                        className="w-32"
                      />
                      <span className="w-12 text-right">{distribution.thirdPercent}%</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Distribution:</span>
                    <span className={`font-semibold ${
                      (distribution.firstPercent + distribution.secondPercent + distribution.thirdPercent) === 100
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {distribution.firstPercent + distribution.secondPercent + distribution.thirdPercent}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prize Pool Info */}
          {tournament.prize_pool > 0 && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Prize Pool to Distribute</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {tournament.prize_pool.toLocaleString()} XP
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Distribution</div>
                  <div className="text-sm text-white">
                    {requiredWinners === 1 ? '100% to Winner' : 
                     requiredWinners === 2 ? `${distribution.firstPercent}% / ${distribution.secondPercent}%` :
                     `${distribution.firstPercent}% / ${distribution.secondPercent}% / ${distribution.thirdPercent}%`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Winner Selection */}
          <div className="space-y-4">
            {/* First Place */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getWinnerIcon('first')}
                    <span>1st Place (Required)</span>
                    {tournament.type === 'survival' && (
                      <span className="text-xs text-purple-400">
                        {getWinnerTitle('first')}
                      </span>
                    )}
                  </div>
                  {tournament.prize_pool > 0 && (
                    <span className="text-yellow-400 font-semibold">
                      {calculatePrizeAmount(distribution.firstPercent).toLocaleString()} XP
                    </span>
                  )}
                </div>
              </label>
              <select
                value={winners.first}
                onChange={(e) => handleWinnerChange('first', e.target.value)}
                className="input-primary w-full"
                disabled={loading}
              >
                <option value="">Select 1st Place Winner</option>
                {participants.map((participant) => (
                  <option key={participant.user_id} value={participant.user_id}>
                    {participant.username} {participant.user_id === tournament.creator_id && '(Creator)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Second Place (if required) */}
            {(requiredWinners >= 2 || tournament.type === 'survival') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getWinnerIcon('second')}
                      <span>2nd Place {tournament.type === 'survival' ? '(Required)' : '(Optional)'}</span>
                      {tournament.type === 'survival' && (
                        <span className="text-xs text-blue-400">
                          {getWinnerTitle('second')}
                        </span>
                      )}
                    </div>
                    {tournament.prize_pool > 0 && distribution.secondPercent > 0 && (
                      <span className="text-blue-400 font-semibold">
                        {calculatePrizeAmount(distribution.secondPercent).toLocaleString()} XP
                      </span>
                    )}
                  </div>
                </label>
                <select
                  value={winners.second}
                  onChange={(e) => handleWinnerChange('second', e.target.value)}
                  className="input-primary w-full"
                  disabled={loading}
                >
                  <option value="">Select 2nd Place</option>
                  <option value="">{tournament.type === 'survival' ? 'Required' : 'None'}</option>
                  {getAvailableParticipants([winners.first]).map((participant) => (
                    <option key={participant.user_id} value={participant.user_id}>
                      {participant.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Third Place (if required) */}
            {(requiredWinners >= 3 || tournament.type === 'survival') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getWinnerIcon('third')}
                      <span>3rd Place {tournament.type === 'survival' ? '(Required)' : '(Optional)'}</span>
                      {tournament.type === 'survival' && (
                        <span className="text-xs text-red-400">
                          {getWinnerTitle('third')}
                        </span>
                      )}
                    </div>
                    {tournament.prize_pool > 0 && distribution.thirdPercent > 0 && (
                      <span className="text-red-400 font-semibold">
                        {calculatePrizeAmount(distribution.thirdPercent).toLocaleString()} XP
                      </span>
                    )}
                  </div>
                </label>
                <select
                  value={winners.third}
                  onChange={(e) => handleWinnerChange('third', e.target.value)}
                  className="input-primary w-full"
                  disabled={loading}
                >
                  <option value="">Select 3rd Place</option>
                  <option value="">{tournament.type === 'survival' ? 'Required' : 'None'}</option>
                  {getAvailableParticipants([winners.first, winners.second]).map((participant) => (
                    <option key={participant.user_id} value={participant.user_id}>
                      {participant.username}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Prize Distribution Preview */}
          {tournament.prize_pool > 0 && winners.first && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="font-semibold text-white mb-3">Prize Distribution Preview</h4>
              <div className="space-y-3">
                {winners.first && distribution.firstPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getWinnerIcon('first')}
                      <span className="text-white">1st Place</span>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-semibold">
                        {calculatePrizeAmount(distribution.firstPercent).toLocaleString()} XP
                      </div>
                      <div className="text-xs text-gray-400">
                        {distribution.firstPercent}% of prize pool
                      </div>
                    </div>
                  </div>
                )}
                {winners.second && distribution.secondPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getWinnerIcon('second')}
                      <span className="text-white">2nd Place</span>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-400 font-semibold">
                        {calculatePrizeAmount(distribution.secondPercent).toLocaleString()} XP
                      </div>
                      <div className="text-xs text-gray-400">
                        {distribution.secondPercent}% of prize pool
                      </div>
                    </div>
                  </div>
                )}
                {winners.third && distribution.thirdPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getWinnerIcon('third')}
                      <span className="text-white">3rd Place</span>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-semibold">
                        {calculatePrizeAmount(distribution.thirdPercent).toLocaleString()} XP
                      </div>
                      <div className="text-xs text-gray-400">
                        {distribution.thirdPercent}% of prize pool
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteTournament}
              disabled={loading || !winners.first || (tournament.type === 'survival' && (!winners.second || !winners.third))}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-2 inline" />
                  Completing...
                </>
              ) : (
                <>
                  {tournament.type === 'survival' ? (
                    <Crown className="w-5 h-5 mr-2 inline" />
                  ) : (
                    <Trophy className="w-5 h-5 mr-2 inline" />
                  )}
                  Complete Tournament
                </>
              )}
            </button>
          </div>

          {/* Warning */}
          <div className="text-xs text-gray-400 pt-4 border-t border-gray-800">
            <p className="flex items-start space-x-2">
              <span className="text-yellow-400">⚠</span>
              <span>
                {tournament.type === 'survival' ? (
                  <>Completing this Survival tournament will award special titles to all 3 winners. </>
                ) : null}
                Completing the tournament will: Distribute prizes, update player stats, 
                and mark tournament as completed. This action cannot be undone.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentCompletionModal;