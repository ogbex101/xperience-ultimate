import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Swords, User, ChevronRight, Award, Loader, AlertCircle, CheckCircle, Bug, RefreshCw } from 'lucide-react';
import { tournamentsAPI } from '../utils/api';
import MatchResultModal from './MatchResultModal';

const TournamentBracket = ({ tournamentId, tournamentType, isCreator, currentUserId, currentUser, onTournamentStarted }) => {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingTournament, setStartingTournament] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [forceGeneratingMatches, setForceGeneratingMatches] = useState(false);
  const [manualAdvancing, setManualAdvancing] = useState(false);

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchBracket = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setDebugInfo(null);
      
      console.log('🔄 Fetching bracket for tournament:', tournamentId);
      const startTime = Date.now();
      
      const response = await tournamentsAPI.getBracket(tournamentId);
      
      console.log('✅ Bracket fetched in', Date.now() - startTime, 'ms');
      console.log('📊 Full response:', response);
      
      if (response.success) {
        const debugData = {
          tournamentId,
          status: response.bracket?.status,
          roundsCount: response.bracket?.rounds?.length,
          shouldGenerate: response.bracket?.should_generate_bracket,
          participantCount: response.bracket?.participant_count,
          tournamentType: response.bracket?.tournament_type,
          totalMatches: response.bracket?.total_matches,
          hasWinner: !!response.bracket?.winner,
          winnerName: response.bracket?.winner?.username,
          isCreator: isCreator,
          currentUserId: currentUser?.id
        };
        
        console.log('📊 Bracket data received:', debugData);
        setDebugInfo(debugData);
        setBracket(response.bracket);
        
        if (response.bracket?.status === 'ongoing' && (!response.bracket?.rounds || response.bracket.rounds.length === 0)) {
          console.error('❌ Tournament is ongoing but has no bracket!');
        }
        
        if (response.bracket?.status === 'upcoming' && response.bracket?.should_generate_bracket) {
          setError('Tournament is ready to start. Click "Start Tournament" to generate bracket.');
        }
      } else {
        console.error('❌ Bracket fetch failed:', response.error);
        setError(response.error || 'Failed to load bracket');
      }
    } catch (err) {
      console.error('❌ Error fetching bracket:', err);
      setError(err.message || 'Failed to load tournament bracket');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, isCreator, currentUser]);

  // Initial fetch
  useEffect(() => {
    if (tournamentId) {
      fetchBracket();
    }
  }, [tournamentId, fetchBracket]);

  // Poll for updates if tournament is ongoing
  useEffect(() => {
    let intervalId;
    
    if (bracket?.status === 'ongoing') {
      intervalId = setInterval(fetchBracket, 15000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bracket?.status, fetchBracket]);

  const handleStartTournament = async () => {
    if (!isCreator || !tournamentId) return;
    
    try {
      setStartingTournament(true);
      setError('');
      
      // Try fix matches first
      try {
        const fixResult = await tournamentsAPI.fixMatches(tournamentId);
        if (fixResult.success) {
          alert('✅ Matches generated successfully!');
          await fetchBracket();
          if (onTournamentStarted) onTournamentStarted();
          return;
        }
      } catch (fixError) {
        console.log('Fix matches failed:', fixError.message);
      }
      
      // Try normal start
      const startResult = await tournamentsAPI.start(tournamentId);
      
      if (startResult.success) {
        await fetchBracket();
        if (onTournamentStarted) onTournamentStarted();
        alert('✅ Tournament started successfully!');
      } else {
        setError(startResult.error || 'Failed to start tournament');
      }
    } catch (err) {
      console.error('Start tournament error:', err);
      setError(err.response?.data?.error || 'Failed to start tournament');
    } finally {
      setStartingTournament(false);
    }
  };

  const handleManualAdvance = async (match) => {
    if (!match?.winner?.id) {
      alert('Match must have a winner to advance');
      return;
    }
    
    console.log('🔧 Manual advance clicked:', {
      matchId: match.id,
      winnerId: match.winner.id,
      winnerName: match.winner.username,
      isCreator: isCreator,
      tournamentId: tournamentId
    });
    
    if (!confirm(`Manually advance winner ${match.winner.username} to next round?`)) {
      return;
    }
    
    try {
      setManualAdvancing(true);
      
      const result = await tournamentsAPI.manualAdvance(tournamentId, match.id, match.winner.id);
      
      if (result.success) {
        alert('✅ Winner advanced to next round!');
        fetchBracket();
      } else {
        alert('❌ Failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Manual advance error:', error);
      alert('Error: ' + error.message);
    } finally {
      setManualAdvancing(false);
    }
  };

  const handleMatchClick = (match) => {
    // Get current user ID
    const userIdFromProps = currentUser?.id;
    const userIdFromStorage = JSON.parse(localStorage.getItem('user'))?.id;
    const tokenUserId = JSON.parse(localStorage.getItem('userData'))?.id;
    const currentUserId = userIdFromProps || userIdFromStorage || tokenUserId;

    // Check if match is actionable
    if (match.status !== 'ongoing' && match.status !== 'upcoming') {
      return;
    }

    // Convert to strings for comparison
    const player1IdStr = match.player1?.id ? String(match.player1.id) : null;
    const player2IdStr = match.player2?.id ? String(match.player2.id) : null;
    const currentUserIdStr = currentUserId ? String(currentUserId) : null;

    // Check if user is in this match
    const isUserInMatch = currentUserIdStr === player1IdStr || currentUserIdStr === player2IdStr;
    const hasValidPlayers = match.player1 && match.player2;

    // Show modal if user is in match or is creator
    if ((isUserInMatch && hasValidPlayers) || (isCreator && hasValidPlayers)) {
      setSelectedMatch(match);
      setShowResultModal(true);
    } else {
      alert('You can only submit results for matches you are participating in');
    }
  };

  const handleResultSubmitted = () => {
    fetchBracket();
  };

  const getMatchStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 border-green-500/30';
      case 'ongoing': return 'bg-yellow-500/20 border-yellow-500/30';
      default: return 'bg-gray-800 border-gray-700';
    }
  };

  const getPlayerDisplay = (player) => {
    if (!player) return <span className="text-gray-500 italic">TBD</span>;
    return (
      <div className="flex items-center space-x-2 min-w-0">
        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-3 h-3 text-white" />
        </div>
        <span className="text-white font-medium truncate" title={player.username}>
          {player.username}
        </span>
        {player.rank && (
          <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full flex-shrink-0">
            {player.rank}
          </span>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="card flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading bracket...</p>
        </div>
      </div>
    );
  }

  const hasOngoingNoMatchesIssue = bracket?.status === 'ongoing' && 
    (!bracket.rounds || bracket.rounds.length === 0) &&
    bracket.participant_count >= 2;

  const tournamentReadyToStart = bracket?.status === 'upcoming' && 
    bracket?.participant_count >= 2 && isCreator;

  const hasBracketData = bracket?.rounds && bracket.rounds.length > 0;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-gradient rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Tournament Bracket</h3>
            <p className="text-gray-400 text-sm">
              {bracket?.status === 'upcoming' ? 'Tournament starts soon' : 
               bracket?.status === 'ongoing' ? 'Live tournament in progress' : 
               'Tournament completed'}
              {isCreator && ' (You are creator)'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchBracket}
            className="text-sm text-purple-400 hover:text-purple-300 flex items-center space-x-1"
            title="Refresh bracket"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          {tournamentReadyToStart && (
            <button
              onClick={handleStartTournament}
              disabled={startingTournament}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 ml-2"
            >
              {startingTournament ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  <span>Start Tournament</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Debug info */}
      {debugInfo && process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg text-xs">
          <div className="text-yellow-400 mb-1">Debug Info:</div>
          <div className="grid grid-cols-2 gap-1">
            <div>Tournament ID: {debugInfo.tournamentId}</div>
            <div>Status: {debugInfo.status}</div>
            <div>Type: {debugInfo.tournamentType}</div>
            <div>Participants: {debugInfo.participantCount}</div>
            <div>Is Creator: {debugInfo.isCreator?.toString()}</div>
            <div>Your User ID: {debugInfo.currentUserId}</div>
          </div>
        </div>
      )}

      {/* Special case: Tournament is ongoing but has no matches */}
      {hasOngoingNoMatchesIssue ? (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h4 className="text-white font-medium mb-2">Database Issue Detected</h4>
          <p className="text-gray-400 mb-4">
            Tournament #{tournamentId} is marked as ongoing with {bracket.participant_count} participants, but no matches were created.
          </p>
          
          {isCreator ? (
            <button
              onClick={async () => {
                try {
                  setForceGeneratingMatches(true);
                  const result = await tournamentsAPI.fixMatches(tournamentId);
                  if (result.success) {
                    alert('✅ Matches generated!');
                    fetchBracket();
                  } else {
                    alert('❌ Failed: ' + result.error);
                  }
                } catch (err) {
                  alert('Error: ' + err.message);
                } finally {
                  setForceGeneratingMatches(false);
                }
              }}
              disabled={forceGeneratingMatches}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              {forceGeneratingMatches ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Generating Matches...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Fix Tournament Matches</span>
                </>
              )}
            </button>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <p className="text-gray-300">
                Only the tournament creator can fix this issue.
              </p>
            </div>
          )}
        </div>
      ) : hasBracketData ? (
        /* Normal bracket display */
        <div className="space-y-6">
          {/* Bracket visualization */}
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-6 min-w-max">
              {bracket.rounds.map((round) => (
                <div key={round.number} className="flex flex-col flex-shrink-0">
                  <div className="mb-4 text-center sticky top-0 bg-gray-900/80 backdrop-blur-sm py-2 z-10">
                    <h4 className="text-white font-semibold">{round.name}</h4>
                    <p className="text-gray-400 text-sm">
                      {round.completed_count}/{round.match_count} completed
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {round.matches.map((match) => (
                      <div
                        key={match.id}
                        className={`w-64 p-4 rounded-lg border ${getMatchStatusColor(match.status)} cursor-pointer hover:border-purple-500/50 transition-colors`}
                        onClick={() => handleMatchClick(match)}
                      >
                        {/* DEBUG INFO */}
                        <div className="text-xs bg-blue-900/20 p-1 mb-1 rounded text-blue-300">
                          Match {match.id}: {match.status}
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">
                            Match {match.id}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            match.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400'
                              : match.status === 'ongoing'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {match.status}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Player 1 */}
                          <div className={`p-2 rounded ${
                            match.winner?.id === match.player1?.id 
                              ? 'bg-green-500/10 border border-green-500/20'
                              : 'bg-gray-800'
                          }`}>
                            {getPlayerDisplay(match.player1)}
                          </div>
                          
                          {/* VS */}
                          <div className="flex items-center justify-center text-gray-500 text-xs">
                            <Swords className="w-3 h-3 mx-2" />
                            <span>VS</span>
                            <Swords className="w-3 h-3 mx-2" />
                          </div>
                          
                          {/* Player 2 */}
                          <div className={`p-2 rounded ${
                            match.winner?.id === match.player2?.id 
                              ? 'bg-green-500/10 border border-green-500/20'
                              : 'bg-gray-800'
                          }`}>
                            {getPlayerDisplay(match.player2)}
                          </div>
                        </div>
                        
                        {/* WINNER DISPLAY WITH ADVANCE BUTTON */}
                        {match.winner && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-sm">
                                <Award className="w-3 h-3 text-yellow-400" />
                                <span className="text-gray-300">Winner:</span>
                                <span className="text-green-400 font-medium" title={match.winner.username}>
                                  {match.winner.username}
                                </span>
                                <span className="text-xs text-gray-500">(ID: {match.winner.id})</span>
                              </div>
                              
                              {/* ADVANCE BUTTON - Always show for completed matches in ongoing tournaments */}
                              {match.status === 'completed' && bracket?.status === 'ongoing' && isCreator && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleManualAdvance(match);
                                  }}
                                  disabled={manualAdvancing}
                                  className="ml-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50 flex items-center space-x-1"
                                  title="Manually advance winner to next round"
                                >
                                  {manualAdvancing ? (
                                    <>
                                      <Loader className="w-3 h-3 animate-spin" />
                                      <span>Advancing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Advance</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            
                            {/* DEBUG: Show why button might not be showing */}
                            {match.status === 'completed' && bracket?.status === 'ongoing' && !isCreator && (
                              <div className="text-xs text-gray-500 mt-1">
                                (Only tournament creator can advance winners)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tournament winner */}
          {bracket.winner && bracket.status === 'completed' && (
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-4 rounded-lg">
              <div className="flex items-center justify-center space-x-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Tournament Winner</p>
                  <p className="text-white font-bold text-lg">{bracket.winner_username || 'Unknown'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : bracket?.status === 'upcoming' ? (
        /* Tournament not started yet */
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Swords className="w-10 h-10 text-gray-500" />
          </div>
          <h4 className="text-white font-medium mb-2">Bracket Not Generated Yet</h4>
          <p className="text-gray-400 mb-6">
            Tournament will start when the creator begins the competition.
            {bracket?.participant_count >= 2 && isCreator && (
              <span className="block mt-2 text-green-400">
                Ready to start with {bracket.participant_count} participants!
              </span>
            )}
          </p>
        </div>
      ) : (
        /* General error or unknown state */
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-gray-500" />
          </div>
          <h4 className="text-white font-medium mb-2">Unable to Load Bracket</h4>
          <p className="text-gray-400 mb-6">
            There was an issue loading the tournament bracket data.
          </p>
          <button
            onClick={fetchBracket}
            className="btn-secondary"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Match Result Modal */}
      {showResultModal && selectedMatch && (
        <MatchResultModal
          match={selectedMatch}
          tournamentId={tournamentId}
          onClose={() => {
            setShowResultModal(false);
            setSelectedMatch(null);
          }}
          onResultSubmitted={handleResultSubmitted}
          currentUserId={currentUser?.id}
          isCreator={isCreator}
        />
      )}
    </div>
  );
};

export default React.memo(TournamentBracket);