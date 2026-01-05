import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api'; // Changed from axios to use your api utility
import './MatchHistory.css';

const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, live: 0, open: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatchHistory();
    fetchUserStats();
  }, [filter]);

  const fetchMatchHistory = async () => {
    try {
      setLoading(true);
      
      // ✅ FIXED: Fetch ALL matches user can see (not just participated in)
      const response = await api.get('/matches');
      
      console.log('All matches response:', response);
      
      let matchesData = [];
      
      // Handle different response structures
      if (response.success) {
        if (Array.isArray(response.matches)) {
          matchesData = response.matches;
        } else if (response.data && Array.isArray(response.data.matches)) {
          matchesData = response.data.matches;
        } else if (Array.isArray(response.data)) {
          matchesData = response.data;
        }
      }
      
      // Filter if needed
      if (filter !== 'all') {
        if (filter === 'open') {
          // Show open matches user can join
          matchesData = matchesData.filter(match => 
            match.status === 'pending' && 
            match.opponent_type === 'open' && 
            !match.player2_id &&
            match.player1_id !== user?.id
          );
        } else if (filter === 'my_matches') {
          // Show only matches user is participating in
          matchesData = matchesData.filter(match => 
            match.player1_id === user?.id || 
            match.player2_id === user?.id
          );
        } else {
          matchesData = matchesData.filter(match => match.status === filter);
        }
      }
      
      setMatches(matchesData);
      
      // Update stats
      const userMatches = matchesData.filter(m => 
        m.player1_id === user?.id || m.player2_id === user?.id
      );
      const openMatches = matchesData.filter(m => 
        m.status === 'pending' && 
        m.opponent_type === 'open' && 
        !m.player2_id &&
        m.player1_id !== user?.id
      );
      
      setStats({
        total: matchesData.length,
        live: matchesData.filter(m => m.status === 'ongoing').length,
        open: openMatches.length,
        my_matches: userMatches.length
      });
      
    } catch (error) {
      console.error('Error fetching match history:', error);
      
      // Fallback to user history only if all matches fails
      try {
        console.log('Trying user history endpoint: /matches/user/history');
        const fallbackResponse = await api.get('/matches/user/history', {
          params: { page: 1, limit: 100 }
        });
        
        if (fallbackResponse.success && Array.isArray(fallbackResponse.matches)) {
          let fallbackData = fallbackResponse.matches;
          if (filter !== 'all') {
            fallbackData = fallbackData.filter(match => match.status === filter);
          }
          setMatches(fallbackData);
          setStats({
            total: fallbackData.length,
            live: fallbackData.filter(m => m.status === 'ongoing').length,
            open: 0, // Can't get open matches from user history
            my_matches: fallbackData.length
          });
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/matches/user/stats');
      if (response.success) {
        console.log('User stats:', response.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Update the getCurrencyDisplay function
  const getCurrencyDisplay = (match) => {
    const individualStake = match.individual_stake || match.stake_amount;
    const totalStakes = match.total_stakes || (match.stake_amount * 2);
    
    if (match.stake_currency === 'xp') {
      return {
        stake: `${individualStake} XP`,
        total: `${totalStakes} XP`,
        prize: `${match.prize_pool_amount} XP`,
        symbol: '⚡'
      };
    } else {
      return {
        stake: `₦${parseFloat(individualStake).toLocaleString()}`,
        total: `₦${parseFloat(totalStakes).toLocaleString()}`,
        prize: `₦${parseFloat(match.prize_pool_amount).toLocaleString()}`,
        symbol: '💰'
      };
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'pending', text: 'PENDING', icon: '⏳' },
      ongoing: { class: 'ongoing', text: 'LIVE', icon: '⚡' },
      completed: { class: 'completed', text: 'COMPLETED', icon: '🏆' },
      pending_confirmation: { class: 'pending-confirm', text: 'AWAITING CONFIRMATION', icon: '🤝' },
      disputed: { class: 'disputed', text: 'DISPUTED', icon: '⚖️' },
      cancelled: { class: 'cancelled', text: 'CANCELLED', icon: '❌' }
    };
    
    const config = statusConfig[status] || { class: 'pending', text: status, icon: '❓' };
    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon">{config.icon}</span>
        <span className="status-text">{config.text}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ NEW: Check if user can join this match
  const canJoinMatch = (match) => {
    return match.status === 'pending' && 
           match.opponent_type === 'open' && 
           !match.player2_id && 
           match.player1_id !== user?.id;
  };

  // ✅ NEW: Join match function
  const joinMatch = async (matchId) => {
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;
      
      const currency = getCurrencyDisplay(match);
      
      const confirmJoin = window.confirm(
        `Join this match?\n\n` +
        `Game: ${match.game}\n` +
        `Stake: ${currency.stake}\n` +
        `Opponent: ${match.player1_username}\n\n` +
        `The stake amount will be deducted from your balance.`
      );
      
      if (!confirmJoin) return;

      const response = await api.post(`/matches/${matchId}/join`);
      if (response.success) {
        alert('✅ Successfully joined the match!');
        fetchMatchHistory(); // Refresh the list
        navigate(`/matches/${matchId}`); // Go to match details
      }
    } catch (error) {
      console.error('Error joining match:', error);
      alert(error.data?.error || 'Failed to join match');
    }
  };

  const getMatchActions = (match) => {
    if (!user) return null;

    const isParticipant = user.id === match.player1_id || user.id === match.player2_id;

    return (
      <div className="match-actions">
        <button 
          className="action-btn view-details"
          onClick={() => navigate(`/matches/${match.id}`)}
        >
          <span className="btn-icon">👁️</span>
          VIEW DETAILS
        </button>
        
        {match.status === 'ongoing' && isParticipant && (
          <button 
            className="action-btn submit-result"
            onClick={() => navigate(`/matches/${match.id}`)}
          >
            <span className="btn-icon">⚔️</span>
            SUBMIT RESULT
          </button>
        )}
        
        {/* ✅ ADDED: Join button for open matches */}
        {canJoinMatch(match) && (
          <button 
            className="action-btn join-match"
            onClick={() => joinMatch(match.id)}
          >
            <span className="btn-icon">🎮</span>
            JOIN MATCH
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading match history...</p>
      </div>
    );
  }

  return (
    <div className="match-history-container">
      <div className="match-history-header">
        <div className="header-content">
          <h1>🎮 MATCH HISTORY & OPEN MATCHES</h1>
          <div className="header-stats">
            <span className="stat-item">Total: {stats.total}</span>
            <span className="stat-item">
              Live: {stats.live}
            </span>
            <span className="stat-item">
              Open: {stats.open}
            </span>
            <span className="stat-item">
              My Matches: {stats.my_matches}
            </span>
          </div>
        </div>
        
        <div className="filter-tabs">
          {['all', 'my_matches', 'open', 'ongoing', 'pending', 'completed', 'disputed'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'my_matches' ? 'MY MATCHES' : 
               status === 'open' ? 'OPEN TO JOIN' : 
               status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="matches-list">
        {matches.length === 0 ? (
          <div className="no-matches">
            <div className="no-matches-icon">
              {filter === 'open' ? '🎮' : 
               filter === 'my_matches' ? '👤' : 
               '📊'}
            </div>
            <h3>
              {filter === 'open' ? 'NO OPEN MATCHES' : 
               filter === 'my_matches' ? 'NO MATCHES FOUND' : 
               'NO MATCHES FOUND'}
            </h3>
            <p>
              {filter === 'open' 
                ? 'There are no open matches available to join right now.' 
                : filter === 'my_matches'
                ? 'You haven\'t participated in any matches yet.'
                : 'No matches found with the selected filter.'}
            </p>
            {filter === 'open' && (
              <button 
                className="refresh-btn"
                onClick={fetchMatchHistory}
              >
                <span className="btn-icon">🔄</span>
                REFRESH
              </button>
            )}
            <Link to="/create-match" className="create-match-btn">
              <span className="btn-icon">⚔️</span>
              CREATE NEW MATCH
            </Link>
          </div>
        ) : (
          matches.map(match => {
            const currency = getCurrencyDisplay(match);
            const canJoin = canJoinMatch(match);
            const isMyMatch = match.player1_id === user?.id || match.player2_id === user?.id;
            
            return (
              <div key={match.id} className={`match-card ${canJoin ? 'open-match' : ''} ${isMyMatch ? 'my-match' : ''}`}>
                <div className="match-header">
                  <div className="match-game-info">
                    <div className="game-icon">{currency.symbol}</div>
                    <div>
                      <h3 className="match-game">{match.game || 'Unknown Game'}</h3>
                      <div className="match-meta">
                        <span className="match-id">#{match.id}</span>
                        <span className="match-type">
                          {match.opponent_type === 'open' ? '🌐 Open' : '🎯 Private'}
                        </span>
                        {canJoin && <span className="open-badge">OPEN TO JOIN</span>}
                        {isMyMatch && <span className="my-badge">MY MATCH</span>}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(match.status)}
                </div>
                
                <div className="players-section">
                  <div className="player player1">
                    <span className={`player-name ${user?.id === match.player1_id ? 'you' : ''}`}>
                      {match.player1_username || 'Unknown'}
                      {user?.id === match.player1_id && <span className="you-indicator"> (YOU)</span>}
                    </span>
                    <span className="player-rank">{match.player1_rank || 'E'}</span>
                  </div>
                  
                  <div className="vs-container">
                    <div className="vs-line"></div>
                    <span className="vs">VS</span>
                    <div className="vs-line"></div>
                  </div>
                  
                  <div className="player player2">
                    <span className={`player-name ${user?.id === match.player2_id ? 'you' : ''}`}>
                      {match.player2_username || (canJoin ? 'OPEN SPOT' : 'WAITING...')}
                      {user?.id === match.player2_id && <span className="you-indicator"> (YOU)</span>}
                    </span>
                    {match.player2_rank && <span className="player-rank">{match.player2_rank}</span>}
                  </div>
                </div>
                
                <div className="match-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="label">STAKE</span>
                      <span className={`value ${match.stake_currency}`}>
                        {currency.stake}
                      </span>
                    </div>
                    
                    {match.prize_pool_amount > 0 && (
                      <div className="detail-item">
                        <span className="label">PRIZE POOL</span>
                        <span className={`value prize ${match.stake_currency}`}>
                          {currency.prize}
                        </span>
                      </div>
                    )}
                    
                    {match.prize_pool_option === 'custom' && match.custom_prize_pool && (
                      <div className="detail-item">
                        <span className="label">CUSTOM PRIZE</span>
                        <span className="value custom-prize">
                          {match.stake_currency === 'money' ? '₦' : ''}
                          {parseFloat(match.custom_prize_pool).toLocaleString()}
                          {match.stake_currency === 'xp' ? ' XP' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="label">CREATED</span>
                      <span className="value">{formatDate(match.created_at)}</span>
                    </div>
                    
                    {match.started_at && (
                      <div className="detail-item">
                        <span className="label">STARTED</span>
                        <span className="value">{formatDate(match.started_at)}</span>
                      </div>
                    )}
                    
                    {match.winner_username && (
                      <div className="detail-item">
                        <span className="label">WINNER</span>
                        <span className="value winner">{match.winner_username}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {getMatchActions(match)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MatchHistory;