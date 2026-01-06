import React, { useState, useEffect } from 'react';
import { Trophy, Award, Users, CheckCircle, X, Loader } from 'lucide-react';
import { tournamentsAPI } from '../utils/api';

const TournamentCompletionModal = ({ tournament, onClose, onComplete }) => {
  const [participants, setParticipants] = useState([]);
  const [winnerId, setWinnerId] = useState('');
  const [runnerUpId, setRunnerUpId] = useState('');
  const [thirdPlaceId, setThirdPlaceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchParticipants();
  }, [tournament.id]);

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

  const handleCompleteTournament = async () => {
    if (!winnerId) {
      setError('Please select a winner');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await tournamentsAPI.completeWithWinner(tournament.id, {
        winner_id: parseInt(winnerId),
        runner_up_id: runnerUpId ? parseInt(runnerUpId) : null,
        third_place_id: thirdPlaceId ? parseInt(thirdPlaceId) : null
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Complete Tournament</h2>
              <p className="text-sm text-gray-400">{tournament.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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
                    1st: 70% • 2nd: 20% • 3rd: 10%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Winner Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Winner (Required)</span>
              </div>
            </label>
            <select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              className="input-primary w-full"
              disabled={loading}
            >
              <option value="">Select Winner</option>
              {participants.map((participant) => (
                <option key={participant.user_id} value={participant.user_id}>
                  {participant.username} {participant.user_id === tournament.creator_id && '(Creator)'}
                </option>
              ))}
            </select>
          </div>

          {/* Runner-up Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-gray-400" />
                <span>Runner-up (Optional)</span>
              </div>
            </label>
            <select
              value={runnerUpId}
              onChange={(e) => setRunnerUpId(e.target.value)}
              className="input-primary w-full"
              disabled={loading}
            >
              <option value="">Select Runner-up</option>
              <option value="">None</option>
              {participants
                .filter(p => p.user_id !== parseInt(winnerId))
                .map((participant) => (
                  <option key={participant.user_id} value={participant.user_id}>
                    {participant.username}
                  </option>
                ))}
            </select>
          </div>

          {/* Third Place Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Third Place (Optional)</span>
              </div>
            </label>
            <select
              value={thirdPlaceId}
              onChange={(e) => setThirdPlaceId(e.target.value)}
              className="input-primary w-full"
              disabled={loading}
            >
              <option value="">Select Third Place</option>
              <option value="">None</option>
              {participants
                .filter(p => p.user_id !== parseInt(winnerId) && p.user_id !== parseInt(runnerUpId))
                .map((participant) => (
                  <option key={participant.user_id} value={participant.user_id}>
                    {participant.username}
                  </option>
                ))}
            </select>
          </div>

          {/* Prize Distribution Preview */}
          {tournament.prize_pool > 0 && winnerId && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="font-semibold text-white mb-3">Prize Distribution Preview</h4>
              <div className="space-y-3">
                {winnerId && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-white">1st Place</span>
                    </div>
                    <span className="text-yellow-400 font-semibold">
                      {Math.floor(tournament.prize_pool * 0.7).toLocaleString()} XP
                    </span>
                  </div>
                )}
                {runnerUpId && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-white">2nd Place</span>
                    </div>
                    <span className="text-gray-300 font-semibold">
                      {Math.floor(tournament.prize_pool * 0.2).toLocaleString()} XP
                    </span>
                  </div>
                )}
                {thirdPlaceId && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span className="text-white">3rd Place</span>
                    </div>
                    <span className="text-amber-500 font-semibold">
                      {Math.floor(tournament.prize_pool * 0.1).toLocaleString()} XP
                    </span>
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
              disabled={loading || !winnerId}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-2 inline" />
                  Completing...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5 mr-2 inline" />
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