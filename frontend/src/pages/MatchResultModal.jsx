import React, { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle, CheckCircle, User, Award } from 'lucide-react';
import { tournamentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const MatchResultModal = ({ match, tournamentId, onClose, onResultSubmitted, isCreator }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  // Reset when match changes
  useEffect(() => {
    setSelectedWinner(null);
    setError('');
    setSuccess('');
    setConfirmation(false);
  }, [match]);

  const handleSubmitResult = async () => {
    if (!selectedWinner) {
      setError('Please select a winner');
      return;
    }

    if (!confirmation && match.status === 'ongoing') {
      setConfirmation(true);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const result = await tournamentsAPI.submitMatchResult(tournamentId, match.id, selectedWinner);
      
      if (result.success) {
        setSuccess('Match result submitted successfully!');
        
        // Callback to parent to refresh bracket
        if (onResultSubmitted) {
          onResultSubmitted();
        }
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit result');
      }
    } catch (err) {
      console.error('Submit match result error:', err);
      setError(err.response?.data?.error || 'Failed to submit match result');
    } finally {
      setSubmitting(false);
    }
  };

  if (!match) return null;

  const isPlayerInMatch = (playerId) => {
    return playerId === match.player1?.id || playerId === match.player2?.id;
  };

  const getPlayerName = (player) => {
    if (!player) return 'BYE';
    return `${player.username} ${player.rank ? `(${player.rank})` : ''}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-gradient rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Submit Match Result</h3>
              <p className="text-gray-400 text-sm">
                {match.round_name || `Round ${match.round}`} - Match {match.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Match Details */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Match Status</span>
              <span className={`text-sm px-2 py-1 rounded-full ${
                match.status === 'ongoing' 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : match.status === 'completed'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {match.status}
              </span>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              {/* Player 1 */}
              <div className={`flex items-center justify-between p-3 rounded ${
                selectedWinner === match.player1?.id 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-gray-800'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {getPlayerName(match.player1)}
                    </div>
                    {match.player1?.rank && (
                      <div className="text-gray-400 text-sm">
                        Rank: {match.player1.rank}
                      </div>
                    )}
                  </div>
                </div>
                
                {match.player1 && (
                  <button
                    onClick={() => setSelectedWinner(match.player1.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedWinner === match.player1.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {selectedWinner === match.player1.id ? 'Selected' : 'Select Winner'}
                  </button>
                )}
              </div>

              {/* VS Separator */}
              <div className="flex items-center justify-center my-3">
                <div className="flex-1 h-px bg-gray-700"></div>
                <div className="mx-4 text-gray-500 font-semibold">VS</div>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>

              {/* Player 2 */}
              <div className={`flex items-center justify-between p-3 rounded ${
                selectedWinner === match.player2?.id 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-gray-800'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {getPlayerName(match.player2)}
                    </div>
                    {match.player2?.rank && (
                      <div className="text-gray-400 text-sm">
                        Rank: {match.player2.rank}
                      </div>
                    )}
                  </div>
                </div>
                
                {match.player2 && (
                  <button
                    onClick={() => setSelectedWinner(match.player2.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedWinner === match.player2.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {selectedWinner === match.player2.id ? 'Selected' : 'Select Winner'}
                  </button>
                )}
              </div>
            </div>

            {/* Current Winner (if any) */}
            {match.winner && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-green-400 font-medium">Current Winner</div>
                    <div className="text-white">
                      {match.winner.username || `Player ${match.winner.id}`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              </div>
            )}

            {/* Confirmation Message */}
            {confirmation && (
              <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-400 p-3 rounded-lg mb-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Confirm Winner Selection</p>
                    <p className="text-sm mt-1">
                      Are you sure you want to declare{' '}
                      <span className="font-semibold text-white">
                        {selectedWinner === match.player1?.id 
                          ? getPlayerName(match.player1) 
                          : getPlayerName(match.player2)}
                      </span>{' '}
                      as the winner? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmitResult}
              disabled={submitting || !selectedWinner}
              className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </>
              ) : confirmation ? (
                'Confirm & Submit'
              ) : (
                'Submit Result'
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              <span className="text-yellow-400 font-medium">Note:</span> Only players in this match can submit results.
              The winner will advance to the next round automatically.
            </p>
          </div>
        </div>
		// Add this after the match details display
<div className="mt-4 p-3 bg-gray-800 rounded-lg">
  <div className="flex items-center space-x-2 text-sm">
    {match.player1?.id === userId && (
      <div className="flex items-center space-x-2 text-green-400">
        <User className="w-4 h-4" />
        <span>You are Player 1</span>
      </div>
    )}
    {match.player2?.id === userId && (
      <div className="flex items-center space-x-2 text-blue-400">
        <User className="w-4 h-4" />
        <span>You are Player 2</span>
      </div>
    )}
    {isCreator && (match.player1?.id !== userId && match.player2?.id !== userId) && (
      <div className="flex items-center space-x-2 text-yellow-400">
        <Award className="w-4 h-4" />
        <span>Tournament Admin Mode</span>
      </div>
    )}
  </div>
</div>
      </div>
    </div>
  );
};

export default MatchResultModal;