import React, { useState } from 'react';
import { Users, Crown, X, User, Shield } from 'lucide-react';

const TournamentParticipantList = ({ 
  participants, 
  tournament, 
  isCreator,
  onKickParticipant 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParticipants = participants.filter(p =>
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKick = async (userId) => {
    if (window.confirm('Are you sure you want to remove this participant?')) {
      try {
        // TODO: Implement kick participant API
        console.log('Kicking participant:', userId);
        if (onKickParticipant) {
          onKickParticipant(userId);
        }
      } catch (error) {
        console.error('Failed to kick participant:', error);
      }
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Participants</h3>
            <p className="text-gray-400 text-sm">
              {participants.length}/{tournament.max_players} players joined
            </p>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-10 pr-4 py-2 text-sm w-64"
          />
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No participants yet. Be the first to join!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredParticipants.map((participant, index) => (
            <div
              key={participant.user_id}
              className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {participant.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {participant.user_id === tournament.creator_id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {participant.rank && (
                    <div className="absolute -bottom-1 -right-1">
                      <span className="text-xs px-2 py-0.5 bg-purple-600 rounded-full">
                        {participant.rank}
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">
                      {participant.username}
                    </span>
                    {participant.user_id === tournament.creator_id && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                        Creator
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                    {participant.wins !== undefined && (
                      <span>Wins: {participant.wins}</span>
                    )}
                    {participant.losses !== undefined && (
                      <span>Losses: {participant.losses}</span>
                    )}
                    {participant.win_rate !== undefined && (
                      <span>Win Rate: {participant.win_rate}%</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {participant.is_admin && (
                  <Shield className="w-4 h-4 text-blue-400" />
                )}
                
                {isCreator && 
                 participant.user_id !== tournament.creator_id && 
                 tournament.status === 'upcoming' && (
                  <button
                    onClick={() => handleKick(participant.user_id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Remove participant"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Participant stats */}
      {participants.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Total Participants</div>
              <div className="text-white font-semibold text-lg">
                {participants.length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Slots Remaining</div>
              <div className="text-white font-semibold text-lg">
                {Math.max(0, tournament.max_players - participants.length)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Average Rank</div>
              <div className="text-white font-semibold text-lg">
                {calculateAverageRank(participants)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const calculateAverageRank = (participants) => {
  const ranks = participants.map(p => p.rank);
  if (ranks.length === 0) return 'N/A';
  
  const rankValues = {
    'E': 1, 'D': 2, 'C': 3, 'B': 4, 'A': 5, 'S': 6, 'SS': 7, 'SSS': 8
  };
  
  const validRanks = ranks.filter(rank => rank && rankValues[rank]);
  if (validRanks.length === 0) return 'N/A';
  
  const avgValue = validRanks.reduce((sum, rank) => sum + rankValues[rank], 0) / validRanks.length;
  
  // Find closest rank
  const closestRank = Object.entries(rankValues).reduce((closest, [rank, value]) => {
    return Math.abs(value - avgValue) < Math.abs(closest.value - avgValue) 
      ? { rank, value } 
      : closest;
  }, { rank: 'E', value: 1 });
  
  return closestRank.rank;
};

export default TournamentParticipantList;