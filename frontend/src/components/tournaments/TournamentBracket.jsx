import React, { useState, useEffect } from 'react'
import { Trophy, Swords, User, ChevronRight, Award, Loader, CheckCircle } from 'lucide-react'
import { tournamentsAPI } from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'

const TournamentBracket = ({ tournamentId, tournamentType, isCreator, onTournamentStarted }) => {
  const [bracket, setBracket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  
  const { user } = useAuth()

  useEffect(() => {
    if (tournamentId) {
      fetchBracket()
    }
  }, [tournamentId])

  const fetchBracket = async () => {
    try {
      setLoading(true)
      setError('')
      
      const data = await tournamentsAPI.getBracket(tournamentId)
      
      if (data.success) {
        setBracket(data.bracket)
      } else {
        setError(data.error || 'Failed to load bracket')
      }
    } catch (err) {
      console.error('Error fetching bracket:', err)
      setError('Failed to load tournament bracket')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTournament = async () => {
    if (!window.confirm('Are you sure you want to start the tournament? This cannot be undone.')) {
      return
    }

    try {
      setStarting(true)
      setError('')
      
      const result = await tournamentsAPI.start(tournamentId)
      
      if (result.success) {
        alert('Tournament started successfully!')
        if (onTournamentStarted) {
          onTournamentStarted()
        }
        fetchBracket()
      } else {
        setError(result.error || 'Failed to start tournament')
      }
    } catch (err) {
      console.error('Start tournament error:', err)
      setError('Failed to start tournament')
    } finally {
      setStarting(false)
    }
  }

  const handleSubmitResult = async (matchId, winnerId) => {
    if (!window.confirm('Submit this as the match result?')) {
      return
    }

    try {
      const result = await tournamentsAPI.submitMatchResult(tournamentId, matchId, winnerId)
      
      if (result.success) {
        alert('Match result submitted!')
        fetchBracket()
      } else {
        alert(result.error || 'Failed to submit result')
      }
    } catch (err) {
      console.error('Submit result error:', err)
      alert('Failed to submit match result')
    }
  }

  const getMatchStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 border-green-500/30'
      case 'ongoing': return 'bg-yellow-500/20 border-yellow-500/30 animate-pulse'
      default: return 'bg-gray-800 border-gray-700'
    }
  }

  const getPlayerDisplay = (player, isWinner = false) => {
    if (!player) return (
      <div className="text-gray-500 italic p-2 rounded bg-gray-800">
        Waiting for opponent...
      </div>
    )
    
    return (
      <div className={`p-3 rounded transition-all ${isWinner ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-800 hover:bg-gray-700'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{player.username}</span>
              {player.rank && (
                <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full">
                  {player.rank}
                </span>
              )}
            </div>
            {isWinner && (
              <div className="flex items-center space-x-1 text-green-400 text-xs mt-1">
                <CheckCircle className="w-3 h-3" />
                <span>Winner</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const isUserInMatch = (match) => {
    if (!user) return false
    return match.player1?.id === user.id || match.player2?.id === user.id
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading bracket...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchBracket}
            className="btn-secondary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // If no bracket exists and tournament is upcoming
  if (!bracket || (bracket.rounds?.length === 0 && bracket.status === 'upcoming')) {
    return (
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-gradient rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Tournament Bracket</h3>
              <p className="text-gray-400 text-sm">Waiting to start...</p>
            </div>
          </div>
          
          {isCreator && tournamentType === 'onevsone' && (
            <button
              onClick={handleStartTournament}
              disabled={starting}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {starting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Swords className="w-4 h-4" />
              )}
              <span>{starting ? 'Starting...' : 'Start Tournament'}</span>
            </button>
          )}
        </div>
        
        <div className="text-center py-8 text-gray-400">
          <Swords className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="mb-2">Bracket not yet generated</p>
          <p className="text-sm">
            {isCreator 
              ? 'Start the tournament to generate the bracket'
              : 'Waiting for tournament creator to start'}
          </p>
        </div>
      </div>
    )
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
              {bracket.status === 'completed' ? 'Completed' : 'In Progress'}
            </p>
          </div>
        </div>
        
        {bracket.winner && (
          <div className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg">
            <Award className="w-4 h-4" />
            <span>Winner: {bracket.winner_name || 'Player ' + bracket.winner}</span>
          </div>
        )}
      </div>

      {bracket.rounds?.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Swords className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No matches in this tournament yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-6 min-w-max px-4">
            {bracket.rounds.map((round, roundIndex) => (
              <div key={round.number} className="flex flex-col">
                <div className="mb-4 text-center">
                  <h4 className="text-white font-semibold">{round.name}</h4>
                  <p className="text-gray-400 text-sm">Round {round.number}</p>
                </div>
                
                <div className="space-y-4">
                  {round.matches.map((match, matchIndex) => (
                    <div
                      key={match.id}
                      className={`w-72 p-4 rounded-lg border ${getMatchStatusColor(match.status)}`}
                    >
                      <div className="flex justify-between items-center mb-3">
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
                        {getPlayerDisplay(match.player1, match.winner?.id === match.player1?.id)}
                        
                        {/* VS */}
                        <div className="flex items-center justify-center text-gray-500 text-sm py-1">
                          <div className="flex items-center space-x-2">
                            <Swords className="w-3 h-3" />
                            <span className="font-medium">VS</span>
                            <Swords className="w-3 h-3" />
                          </div>
                        </div>
                        
                        {/* Player 2 */}
                        {getPlayerDisplay(match.player2, match.winner?.id === match.player2?.id)}
                      </div>
                      
                      {/* Action buttons */}
                      {match.status === 'ongoing' && isUserInMatch(match) && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <p className="text-sm text-gray-400 mb-2 text-center">Submit Result:</p>
                          <div className="flex space-x-2">
                            {match.player1 && (
                              <button
                                onClick={() => handleSubmitResult(match.id, match.player1.id)}
                                className="btn-secondary flex-1 text-sm py-1"
                              >
                                {match.player1.username} Wins
                              </button>
                            )}
                            {match.player2 && (
                              <button
                                onClick={() => handleSubmitResult(match.id, match.player2.id)}
                                className="btn-secondary flex-1 text-sm py-1"
                              >
                                {match.player2.username} Wins
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Winner display */}
                      {match.winner && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex items-center justify-center space-x-2 text-sm">
                            <Award className="w-3 h-3 text-yellow-400" />
                            <span className="text-gray-300">Winner: </span>
                            <span className="text-green-400 font-medium">
                              {match.winner.username || 'Player ' + match.winner.id}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Connector arrow */}
                {roundIndex < bracket.rounds.length - 1 && (
                  <div className="flex items-center justify-center mt-4">
                    <ChevronRight className="w-6 h-6 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-white font-medium mb-3">Bracket Legend</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded"></div>
            <span className="text-gray-400">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/30 rounded animate-pulse"></div>
            <span className="text-gray-400">Ongoing</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-800 border border-gray-700 rounded"></div>
            <span className="text-gray-400">Upcoming</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TournamentBracket