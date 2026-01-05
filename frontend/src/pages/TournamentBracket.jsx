import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Swords, User, ChevronRight, Award, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { tournamentsAPI } from '../utils/api';
import MatchResultModal from './MatchResultModal';

const TournamentBracket = ({ tournamentId, tournamentType, isCreator, currentUserId, currentUser,  onTournamentStarted }) => {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingTournament, setStartingTournament] = useState(false);
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
 

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchBracket = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Fetching bracket for tournament:', tournamentId);
      const startTime = Date.now();
      
      const response = await tournamentsAPI.getBracket(tournamentId);
      
      console.log('✅ Bracket fetched in', Date.now() - startTime, 'ms', response);
      
      if (response.success) {
        setBracket(response.bracket);
        
        // If bracket suggests we should generate initial structure
        if (response.bracket?.should_generate_bracket && isCreator) {
          console.log('📋 Tournament ready for bracket generation');
        }
      } else {
        setError(response.error || 'Failed to load bracket');
      }
    } catch (err) {
      console.error('❌ Error fetching bracket:', err);
      setError(err.message || 'Failed to load tournament bracket');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, isCreator]);

  // Initial fetch
  useEffect(() => {
    if (tournamentId) {
      fetchBracket();
    }
  }, [tournamentId, fetchBracket]);
  // Add this effect to check for tournament completion periodically
useEffect(() => {
  let intervalId;
  
  const checkForTournamentCompletion = async () => {
    if (bracket?.status === 'ongoing') {
      // Get updated bracket data
      await fetchBracket();
      
      // Check if tournament should be completed
      const allMatchesCompleted = bracket?.rounds?.every(round => 
        round.matches?.every(match => match.status === 'completed')
      );
      
      const hasWinner = bracket?.winner;
      
      if (allMatchesCompleted && !hasWinner) {
        console.log('🏆 Tournament ready for auto-completion');
        
        // Show notification to creator
        if (isCreator) {
          alert('🎉 All matches completed! Tournament will be completed automatically.');
        }
        
        // Auto-complete tournament (creator only)
        if (isCreator) {
          await checkAndCompleteTournament();
        }
      }
    }
  };
  
  if (bracket?.status === 'ongoing') {
    // Poll every 30 seconds for updates
    intervalId = setInterval(checkForTournamentCompletion, 30000);
  }
  
  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}, [bracket?.status, fetchBracket, isCreator]);

  // Poll for updates if tournament is ongoing
  /*useEffect(() => {
    let intervalId;
    
    if (bracket?.status === 'ongoing') {
      // Poll every 10 seconds for live updates
      intervalId = setInterval(fetchBracket, 10000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bracket?.status, fetchBracket]);*/

  const handleStartTournament = async () => {
    if (!isCreator || !tournamentId) return;
    
    try {
      setStartingTournament(true);
      setError('');
      
      const result = await tournamentsAPI.start(tournamentId);
      
      if (result.success) {
        // Refresh bracket data
        await fetchBracket();
        
        // Notify parent component
        if (onTournamentStarted) {
          onTournamentStarted();
        }
        
        // Show success message
        alert('✅ Tournament started successfully! Bracket has been generated.');
      } else {
        setError(result.error || 'Failed to start tournament');
      }
    } catch (err) {
      console.error('Start tournament error:', err);
      setError(err.response?.data?.error || 'Failed to start tournament');
    } finally {
      setStartingTournament(false);
    }
  };

  const handleGenerateBracket = async () => {
    if (!isCreator) return;
    
    try {
      setGeneratingBracket(true);
      setError('');
      
      // This would call a new endpoint to generate bracket preview
      // For now, we'll just start the tournament
      await handleStartTournament();
    } catch (err) {
      console.error('Generate bracket error:', err);
      setError('Failed to generate bracket: ' + err.message);
    } finally {
      setGeneratingBracket(false);
    }
  };

  // Memoize expensive computations
  const tournamentReadyToStart = useMemo(() => {
    return bracket?.status === 'upcoming' && 
           bracket?.participant_count >= 2 &&
           isCreator;
  }, [bracket, isCreator]);

  const hasBracketData = useMemo(() => {
    return bracket?.rounds && bracket.rounds.length > 0;
  }, [bracket]);

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

const handleMatchClick = (match) => {
  console.log('🚨 DEBUG START ====================');
  
  // Get current user ID from all possible sources
  const userIdFromProps = currentUser?.id;
  const userIdFromStorage = JSON.parse(localStorage.getItem('user'))?.id;
  const tokenUserId = JSON.parse(localStorage.getItem('userData'))?.id;
  
  const currentUserId = userIdFromProps || userIdFromStorage || tokenUserId;
  
  console.log('🔍 USER INFO:', {
    currentUserId,
    userIdFromProps,
    userIdFromStorage,
    tokenUserId,
    currentUserObject: currentUser,
    localStorageUser: JSON.parse(localStorage.getItem('user')),
    localStorageUserData: JSON.parse(localStorage.getItem('userData'))
  });
  
  console.log('🎯 MATCH INFO:', {
    matchId: match.id,
    matchObject: match,
    player1: match.player1,
    player2: match.player2,
    player1Id: match.player1?.id,
    player2Id: match.player2?.id,
    player1IdType: typeof match.player1?.id,
    player2IdType: typeof match.player2?.id,
    matchStatus: match.status,
    matchRound: match.round
  });
  
  // Check if match is actionable
  const isMatchActionable = match.status === 'ongoing' || match.status === 'upcoming';
  
  if (!isMatchActionable) {
    console.log('❌ Match not actionable - status:', match.status);
    console.log('🚨 DEBUG END ====================\n');
    return;
  }
  
  // Convert everything to strings for comparison
  const player1IdStr = match.player1?.id ? String(match.player1.id) : null;
  const player2IdStr = match.player2?.id ? String(match.player2.id) : null;
  const currentUserIdStr = currentUserId ? String(currentUserId) : null;
  
  console.log('🔢 ID COMPARISON (as strings):', {
    currentUserIdStr,
    player1IdStr,
    player2IdStr,
    'currentUserIdStr === player1IdStr': currentUserIdStr === player1IdStr,
    'currentUserIdStr === player2IdStr': currentUserIdStr === player2IdStr,
    'currentUserIdStr == player1IdStr': currentUserIdStr == player1IdStr, // loose equality
    'currentUserIdStr == player2IdStr': currentUserIdStr == player2IdStr  // loose equality
  });
  
  // Check if current user is in this match
  const isUserInMatch = currentUserIdStr === player1IdStr || currentUserIdStr === player2IdStr;
  
  console.log('✅ AUTHORIZATION CHECK:', {
    isUserInMatch,
    isCreator,
    'Should show modal?': isUserInMatch || isCreator,
    'User is player1?': currentUserIdStr === player1IdStr,
    'User is player2?': currentUserIdStr === player2IdStr
  });
  
  // Show modal if:
  // 1. User is in the match, OR
  // 2. User is tournament creator (admin mode)
  if (isUserInMatch || isCreator) {
    setSelectedMatch(match);
    setShowResultModal(true);
    console.log('🎉 Showing result modal - authorized');
  } else {
    console.log('⛔ User not authorized to submit result for this match');
    console.log('Current user ID:', currentUserIdStr);
    console.log('Player 1 ID:', player1IdStr);
    console.log('Player 2 ID:', player2IdStr);
    alert('You can only submit results for matches you are participating in');
  }
  
  console.log('🚨 DEBUG END ====================\n');
};

  // Add this function to refresh bracket after result submission
  const handleResultSubmitted = () => {
    fetchBracket(); // Refresh bracket data
  };
  const checkAndCompleteTournament = async () => {
  try {
    console.log('🔄 Checking if tournament can be completed...');
    
    // First check if all matches are completed
    const allMatchesCompleted = bracket?.rounds?.every(round => 
      round.matches?.every(match => match.status === 'completed')
    );
    
    if (!allMatchesCompleted) {
      alert('❌ Cannot complete tournament: Not all matches are finished');
      return;
    }
    
    // Check if there's a final winner
    const hasFinalWinner = bracket?.winner || bracket?.final_winner;
    
    if (!hasFinalWinner && bracket?.final_match) {
      const finalMatch = bracket.final_match;
      if (finalMatch.winner) {
        console.log('🏆 Final winner found:', finalMatch.winner);
      } else {
        alert('❌ Final match needs a winner before completing tournament');
        return;
      }
    }
    
    // Call API to complete tournament
    const response = await tournamentsAPI.completeTournament(tournamentId);
    
    if (response.success) {
      alert('✅ Tournament completed successfully!');
      fetchBracket(); // Refresh to show completed state
      
      // Notify parent component
      if (onTournamentStarted) {
        onTournamentStarted();
      }
    } else {
      alert(response.error || 'Failed to complete tournament');
    }
  } catch (err) {
    console.error('Complete tournament error:', err);
    alert(err.response?.data?.error || 'Failed to complete tournament');
  }
};
const checkAutoCompleteTournament = useCallback(() => {
  if (!bracket || bracket.status !== 'ongoing') return false;
  
  // Check if all matches are completed
  const allMatchesCompleted = bracket?.rounds?.every(round => 
    round.matches?.every(match => match.status === 'completed')
  );
  
  const hasFinalWinner = bracket?.winner || bracket?.final_winner;
  
  if (allMatchesCompleted && hasFinalWinner) {
    console.log('✅ Tournament ready for automatic completion');
    
    // Show a message to the tournament creator
    if (isCreator) {
      alert('🎉 All matches completed! Click "Complete Tournament" to finalize.');
    }
    
    return true;
  }
  
  return false;
}, [bracket, isCreator]);
// Add this button in the JSX (for tournament creator only)
{bracket?.status === 'ongoing' && isCreator && (
  <button
    onClick={checkAndCompleteTournament}
    className="ml-2 btn-warning flex items-center space-x-2"
  >
    <Trophy className="w-4 h-4" />
    <span>Complete Tournament</span>
  </button>
)}

  // Loading state
  if (loading) {
    return (
      <div className="card flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading bracket...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a moment for large tournaments</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card">
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
        <button
          onClick={fetchBracket}
          className="btn-secondary flex items-center justify-center w-full"
        >
          <Loader className="w-4 h-4 mr-2" />
          Retry Loading Bracket
        </button>
      </div>
    );
  }

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
            </p>
          </div>
        </div>
        
        {tournamentReadyToStart && (
          <button
            onClick={handleStartTournament}
            disabled={startingTournament}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
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
        
        {bracket?.status === 'ongoing' && (
          <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Live</span>
          </div>
        )}
      </div>

      {/* Performance metrics (debug) */}
      {bracket?.performance_metrics && (
        <div className="mb-4 text-xs text-gray-500 bg-gray-800 p-2 rounded">
          Loaded {bracket.performance_metrics.matches_loaded} matches in {bracket.performance_metrics.load_time_ms}ms
        </div>
      )}

      {/* Tournament not started yet */}
      {bracket?.status === 'upcoming' && !hasBracketData && (
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
          
          {bracket?.participant_count < 2 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Need at least 2 participants to start tournament</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bracket display */}
      {hasBracketData ? (
        <div className="space-y-6">
          {/* Bracket navigation for many rounds */}
          {bracket.rounds.length > 3 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {bracket.rounds.map(round => (
                <button
                  key={round.number}
                  className="px-3 py-1 text-sm rounded-full bg-gray-800 hover:bg-gray-700 whitespace-nowrap"
                  onClick={() => {
                    // Scroll to round - implement if needed
                  }}
                >
                  {round.name}
                </button>
              ))}
            </div>
          )}

          {/* Bracket visualization */}
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-6 min-w-max">
              {bracket.rounds.map((round, roundIndex) => (
                <div key={round.number} className="flex flex-col flex-shrink-0">
                  <div className="mb-4 text-center sticky top-0 bg-gray-900/80 backdrop-blur-sm py-2 z-10">
                    <h4 className="text-white font-semibold">{round.name}</h4>
                    <p className="text-gray-400 text-sm">
                      {round.completed_count}/{round.match_count} completed
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {round.matches.map((match, matchIndex) => (
                      <div
                        key={match.id}
                        className={`w-64 p-4 rounded-lg border ${getMatchStatusColor(match.status)} cursor-pointer hover:border-purple-500/50 transition-colors`}
                        onClick={() => handleMatchClick(match)}
                        title={match.status === 'ongoing' ? 'Click to submit result' : 'View match details'}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">
                            Match {matchIndex + 1}
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
                        
                        {/* Winner indicator */}
                        {match.winner && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="flex items-center space-x-2 text-sm">
                              <Award className="w-3 h-3 text-yellow-400" />
                              <span className="text-gray-300">Winner: </span>
                              <span className="text-green-400 font-medium truncate" title={match.winner.username}>
                                {match.winner.username}
                              </span>
                            </div>
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
      ) : bracket?.status === 'ongoing' ? (
        <div className="text-center py-8">
          <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Generating bracket matches...</p>
          <button
            onClick={fetchBracket}
            className="mt-4 text-sm text-purple-400 hover:text-purple-300"
          >
            Refresh
          </button>
        </div>
      ) : null}
      
      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-white font-medium mb-3">Bracket Legend</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded"></div>
            <span className="text-gray-400">Completed Match</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/30 rounded"></div>
            <span className="text-gray-400">Ongoing Match</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-800 border border-gray-700 rounded"></div>
            <span className="text-gray-400">Upcoming Match</span>
          </div>
        </div>
      </div>
	  
{isCreator && bracket?.status === 'ongoing' && (
  <div className="mt-6 pt-6 border-t border-gray-700">
    <h4 className="text-white font-medium mb-4">🎮 Tournament Admin Controls</h4>
    
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h5 className="text-white font-medium mb-2">📋 All Matches</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {bracket.rounds.flatMap(round => 
          round.matches.map(match => (
            <div 
              key={match.id}
              className={`p-3 rounded border cursor-pointer hover:border-purple-500 transition-colors ${
                match.status === 'completed' ? 'border-green-500/30 bg-green-500/10' :
                match.status === 'ongoing' ? 'border-yellow-500/30 bg-yellow-500/10' :
                'border-gray-700 bg-gray-900'
              }`}
              onClick={() => {
                setSelectedMatch(match);
                setShowResultModal(true);
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  Round {match.round} • Match {match.id}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  match.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  match.status === 'ongoing' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {match.status}
                </span>
              </div>
              
              <div className="text-sm">
                <div className="truncate">
                  <span className="text-gray-300">P1:</span>{' '}
                  <span className={match.winner?.id === match.player1?.id ? 'text-green-400' : 'text-white'}>
                    {match.player1?.username || 'TBD'}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-gray-300">P2:</span>{' '}
                  <span className={match.winner?.id === match.player2?.id ? 'text-green-400' : 'text-white'}>
                    {match.player2?.username || 'TBD'}
                  </span>
                </div>
              </div>
              
              {match.winner && (
                <div className="mt-2 text-xs text-green-400 flex items-center">
                  <Trophy className="w-3 h-3 mr-1" />
                  Winner: {match.winner.username}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
    
    <div className="text-sm text-gray-400">
      <p>As tournament creator, you can submit results for any match.</p>
      <p>Click on any match above to submit/update results.</p>
    </div>
  </div>
)}
{bracket?.status === 'ongoing' && isCreator && (
  <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
    <h4 className="text-white font-medium mb-2">🎮 Tournament Completion</h4>
    
    {checkAutoCompleteTournament() ? (
      <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg mb-3">
        <div className="flex items-center space-x-2 text-green-400 mb-2">
          <Trophy className="w-5 h-5" />
          <span className="font-medium">Tournament Ready to Complete!</span>
        </div>
        <p className="text-gray-300 text-sm">
          All matches are finished. Click the button below to complete the tournament
          and distribute prizes.
        </p>
      </div>
    ) : (
      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg mb-3">
        <div className="flex items-center space-x-2 text-yellow-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Tournament in Progress</span>
        </div>
        <p className="text-gray-300 text-sm">
          Some matches are still ongoing or need winners. 
          You can complete the tournament when all matches are finished.
        </p>
      </div>
    )}
    
    <button
      onClick={checkAndCompleteTournament}
      disabled={!checkAutoCompleteTournament()}
      className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${
        checkAutoCompleteTournament() 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
      }`}
    >
      <Trophy className="w-4 h-4" />
      <span>Complete Tournament</span>
    </button>
    
    {checkAutoCompleteTournament() && (
      <p className="text-xs text-gray-400 mt-2">
        This will distribute prizes and mark the tournament as completed.
      </p>
    )}
  </div>
)}
      
      {/* Add the modal at the bottom of your return statement (before the closing div) */}
     {showResultModal && selectedMatch && (
  <MatchResultModal
    match={selectedMatch}
    tournamentId={tournamentId}
    onClose={() => {
      setShowResultModal(false);
      setSelectedMatch(null);
    }}
    onResultSubmitted={handleResultSubmitted}
    currentUserId={currentUser?.id}  // Add this
    isCreator={isCreator}  // Add this
  />
)}
    </div>
  );
};

export default React.memo(TournamentBracket);