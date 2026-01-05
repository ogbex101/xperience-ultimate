import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import './Matches.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
    fetchStats();
    fetchPendingInvitations();
  }, [filter]);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/matches');
      if (response.success) {
        console.log('Fetched matches:', response.matches.length);
        setMatches(response.matches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/matches/user/stats');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const response = await api.get('/matches/invitations/pending');
      if (response.success) {
        console.log('Pending invitations from API:', response.invitations.length);
        setPendingInvitations(response.invitations.length);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      // Fallback: count invitations from matches list
      const invitationCount = matches.filter(match => isMatchInvitation(match)).length;
      setPendingInvitations(invitationCount);
    }
  };

  // ==================== JOIN OPEN MATCH ====================
  const joinMatch = async (matchId) => {
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;
      
      const stakeAmount = match.stake_currency === 'money' 
        ? `₦${parseFloat(match.stake_amount || 0).toLocaleString()}` 
        : `${match.stake_amount} XP`;
      
      const confirmJoin = window.confirm(
        `Join this match?\n\n` +
        `Game: ${match.game}\n` +
        `Stake: ${stakeAmount}\n` +
        `Opponent: ${match.player1_username}\n\n` +
        `The stake amount will be deducted from your balance.`
      );
      
      if (!confirmJoin) return;

      const response = await api.post(`/matches/${matchId}/join`);
      if (response.success) {
        alert('✅ Successfully joined the match!');
        fetchMatches(); // Refresh matches list
        navigate(`/matches/${matchId}`); // Go to match details
      }
    } catch (error) {
      console.error('Error joining match:', error);
      alert(error.data?.error || 'Failed to join match');
    }
  };

  // ==================== ACCEPT INVITATION ====================
  const acceptMatchInvitation = async (matchId) => {
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;
      
      const stakeAmount = match.stake_currency === 'money' 
        ? `₦${parseFloat(match.stake_amount || 0).toLocaleString()}` 
        : `${match.stake_amount} XP`;
      
      const confirmAccept = window.confirm(
        `Accept this match invitation?\n\n` +
        `Game: ${match.game}\n` +
        `Stake: ${stakeAmount}\n` +
        `Opponent: ${match.player1_username}\n\n` +
        `The stake amount will be deducted from your balance.`
      );
      
      if (!confirmAccept) return;

      // ✅ FIXED: Use /accept endpoint for specific invitations
      const response = await api.post(`/matches/${matchId}/accept`);
      if (response.success) {
        alert('✅ Match accepted successfully! Game is now active.');
        fetchMatches(); // Refresh matches list
        fetchPendingInvitations(); // Update invitation count
        navigate(`/matches/${matchId}`); // Go to match details
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert(error.data?.error || 'Failed to accept invitation');
    }
  };

  // ==================== REJECT INVITATION ====================
  const rejectMatchInvitation = async (matchId) => {
    try {
      const confirmReject = window.confirm('Are you sure you want to reject this match invitation?');
      if (!confirmReject) return;

      // ✅ NEW: Use /decline endpoint
      const response = await api.post(`/matches/${matchId}/decline`);
      if (response.success) {
        alert('Invitation declined.');
        fetchMatches(); // Refresh matches list
        fetchPendingInvitations(); // Update invitation count
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      alert(error.message || 'Failed to reject invitation');
    }
  };

  // ==================== CHECK IF MATCH IS INVITATION ====================
  const isMatchInvitation = (match) => {
    // ✅ FIXED: Check opponent_username instead of player2_id
    const isInvitation = match.status === 'pending' && 
           match.opponent_type === 'specific' && 
           match.opponent_username === user?.username &&
           !match.player2_id &&
           match.player1_id !== user?.id;
    
    // Debug log
    if (match.opponent_type === 'specific' && match.status === 'pending') {
      console.log(`Match ${match.id}:`, {
        opponent_username: match.opponent_username,
        user_username: user?.username,
        player2_id: match.player2_id,
        player1_id: match.player1_id,
        user_id: user?.id,
        isInvitation: isInvitation
      });
    }
    
    return isInvitation;
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'invitations') return isMatchInvitation(match);
    return match.status === filter;
  });

  // Update the getCurrencyDisplay function in Matches.jsx
const getCurrencyDisplay = (match) => {
  const individualStake = match.individual_stake || match.stake_amount;
  const totalStakes = match.total_stakes || (match.stake_amount * 2);
  
  if (match.stake_currency === 'xp') {
    return {
      individual_stake: `${individualStake} XP`,
      total_stakes: `${totalStakes} XP`,
      prize_pool: `${match.prize_pool_amount} XP`,
      platform_fee: '0 XP',
      symbol: '⚡',
      type: 'XP'
    };
  } else {
    return {
      individual_stake: `₦${parseFloat(individualStake).toLocaleString()}`,
      total_stakes: `₦${parseFloat(totalStakes).toLocaleString()}`,
      prize_pool: `₦${parseFloat(match.prize_pool_amount).toLocaleString()}`,
      platform_fee: `₦${parseFloat(match.platform_fee || 0).toLocaleString()}`,
      symbol: '💰',
      type: 'Money'
    };
  }
};

  // ==================== GET STATUS BADGE ====================
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'pending', text: 'Waiting', icon: '⏳', color: '#f59e0b' },
      ongoing: { class: 'ongoing', text: 'Live', icon: '⚡', color: '#3b82f6' },
      completed: { class: 'completed', text: 'Completed', icon: '🏆', color: '#10b981' },
      pending_confirmation: { class: 'pending-confirm', text: 'Pending Confirmation', icon: '🤝', color: '#8b5cf6' },
      disputed: { class: 'disputed', text: 'Disputed', icon: '⚖️', color: '#ef4444' },
      cancelled: { class: 'cancelled', text: 'Cancelled', icon: '❌', color: '#6b7280' }
    };
    const config = statusConfig[status] || { class: 'pending', text: status, icon: '❓', color: '#6b7280' };
    return (
      <span className={`status-badge ${config.class}`} style={{ backgroundColor: config.color }}>
        <span className="status-icon">{config.icon}</span>
        <span className="status-text">{config.text}</span>
      </span>
    );
  };

  // ==================== CAN USER JOIN MATCH? ====================
  const canJoinMatch = (match) => {
    return match.status === 'pending' && 
           match.opponent_type === 'open' && 
           !match.player2_id && 
           match.player1_id !== user?.id;
  };

  // ==================== CAN USER MANAGE MATCH? ====================
  const canManageMatch = (match) => {
    return match.player1_id === user?.id && match.status === 'pending';
  };

  if (loading) {
    return (
      <div className="matches-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>LOADING MATCHES...</p>
        </div>
      </div>
    );
  }

  // Debug log
  console.log('=== DEBUG ===');
  console.log('User:', user?.username);
  console.log('Total matches:', matches.length);
  console.log('Invitation count from API:', pendingInvitations);
  console.log('Invitation count calculated:', matches.filter(isMatchInvitation).length);

  return (
    <div className="matches-container">
      {/* ==================== HEADER SECTION ==================== */}
      <div className="matches-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🎮 Game Matches</h1>
            <p className="header-subtitle">Challenge players, join matches, and compete for rewards</p>
          </div>
          
          {/* Invitations Badge */}
          {pendingInvitations > 0 && (
            <div className="invitations-badge">
              <span className="badge-icon">🎯</span>
              <span className="badge-count">{pendingInvitations}</span>
              <span className="badge-text">
                Pending Invitation{pendingInvitations > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{stats.wins || 0}</span>
                <span className="stat-label">Wins</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.losses || 0}</span>
                <span className="stat-label">Losses</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{parseFloat(stats.win_rate || 0).toFixed(1)}%</span>
                <span className="stat-label">Win Rate</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {stats.total_winnings_money ? `₦${parseFloat(stats.total_winnings_money || 0).toLocaleString()}` : '₦0'}
                  {stats.total_winnings_xp > 0 && ` / ${stats.total_winnings_xp} XP`}
                </span>
                <span className="stat-label">Total Winnings</span>
              </div>
            </div>
          )}
        </div>
        
        <Link to="/create-match" className="create-match-btn">
          <span className="btn-icon">⚔️</span>
          <span className="btn-text">Create Match</span>
        </Link>
      </div>

      {/* ==================== FILTER TABS ==================== */}
      <div className="matches-filter">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-text">All Matches</span>
            <span className="tab-badge">{matches.length}</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <span className="tab-icon">⏳</span>
            <span className="tab-text">Waiting</span>
            <span className="tab-badge">
              {matches.filter(m => m.status === 'pending').length}
            </span>
          </button>
          <button 
            className={`filter-tab ${filter === 'ongoing' ? 'active' : ''}`}
            onClick={() => setFilter('ongoing')}
          >
            <span className="tab-icon">⚡</span>
            <span className="tab-text">Live</span>
            <span className="tab-badge">
              {matches.filter(m => m.status === 'ongoing').length}
            </span>
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            <span className="tab-icon">🏆</span>
            <span className="tab-text">Completed</span>
            <span className="tab-badge">
              {matches.filter(m => m.status === 'completed').length}
            </span>
          </button>
          <button 
            className={`filter-tab ${filter === 'invitations' ? 'active' : ''}`}
            onClick={() => setFilter('invitations')}
          >
            <span className="tab-icon">🎯</span>
            <span className="tab-text">Invitations</span>
            <span className="tab-badge invitation">
              {matches.filter(isMatchInvitation).length}
            </span>
          </button>
        </div>
      </div>

      {/* ==================== MATCHES LIST ==================== */}
      <div className="matches-list">
        {filteredMatches.length === 0 ? (
          <div className="no-matches">
            <div className="no-matches-icon">
              {filter === 'invitations' ? '🎯' : '🎮'}
            </div>
            <h3>
              {filter === 'invitations' 
                ? 'No pending invitations' 
                : 'No matches found'}
            </h3>
            <p>
              {filter === 'invitations' 
                ? 'Wait for players to challenge you or create your own match' 
                : 'Create a match or wait for opponents to challenge you'}
            </p>
            <Link to="/create-match" className="btn-primary">
              <span className="btn-icon">⚔️</span>
              Create New Match
            </Link>
          </div>
        ) : (
          filteredMatches.map(match => {
            const currency = getCurrencyDisplay(match);
            const isInvitation = isMatchInvitation(match);
            
            // Debug each match
            if (isInvitation) {
              console.log(`Rendering invitation match ${match.id}:`, {
                opponent_username: match.opponent_username,
                user_username: user?.username,
                match
              });
            }
            
            return (
              <div key={match.id} className={`match-card ${isInvitation ? 'invitation' : ''}`}>
                {/* Match Header */}
                <div className="match-header">
                  <div className="match-game-info">
                    <div className="game-icon">{match.stake_currency === 'xp' ? '⚡' : '💰'}</div>
                    <div>
                      <h3>{match.game}</h3>
                      <div className="match-meta">
                        {match.scheduled_at && (
                          <span className="match-schedule">
                            <span className="meta-icon">⏰</span>
                            {new Date(match.scheduled_at).toLocaleDateString()}
                          </span>
                        )}
                        <span className="match-type">
                          <span className="meta-icon">
                            {match.opponent_type === 'open' ? '🌐' : '🎯'}
                          </span>
                          {match.opponent_type === 'open' ? 'Open Challenge' : 'Private Match'}
                        </span>
                        <span className="match-currency">
                          <span className="meta-icon">{currency.symbol}</span>
                          {currency.type} Match
                        </span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(match.status)}
                </div>
                
                {/* Players Section */}
                <div className="match-players">
                  <div className="player">
                    <div className="player-info">
                      <span className="player-name">{match.player1_username}</span>
                      <span className="player-rank">{match.player1_rank || 'E'}</span>
                      {match.player1_id === user?.id && <span className="you-tag">YOU</span>}
                    </div>
                    <div className="player-stats">
                      <span className="stat creator">CREATOR</span>
                    </div>
                  </div>
                  
                  <div className="vs-container">
                    <div className="vs-line"></div>
                    <div className="vs">VS</div>
                    <div className="vs-line"></div>
                  </div>
                  
                  <div className="player">
                    <div className="player-info">
                      <span className="player-name">
                        {match.player2_username || (
                          match.opponent_type === 'open' 
                            ? 'OPEN SPOT' 
                            : `INVITED: ${match.opponent_username}`
                        )}
                      </span>
                      {match.player2_rank && <span className="player-rank">{match.player2_rank}</span>}
                      {match.player2_id === user?.id && <span className="you-tag">YOU</span>}
                    </div>
                    <div className="player-stats">
                      {!match.player2_id ? (
                        <span className="stat waiting">WAITING...</span>
                      ) : (
                        <span className="stat opponent">OPPONENT</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Update match details section in Matches.jsx */}
<div className="match-details">
  <div className="detail-item">
    <span className="detail-label">STAKE PER PLAYER</span>
    <span className={`detail-value stake ${match.stake_currency}`}>
      {currency.individual_stake}
    </span>
  </div>
  <div className="detail-item">
    <span className="detail-label">TOTAL STAKES</span>
    <span className={`detail-value total ${match.stake_currency}`}>
      {currency.total_stakes}
    </span>
  </div>
  <div className="detail-item">
    <span className="detail-label">PRIZE POOL</span>
    <span className={`detail-value prize ${match.stake_currency}`}>
      {currency.prize_pool}
    </span>
  </div>
  {match.stake_currency === 'money' && (
    <div className="detail-item">
      <span className="detail-label">PLATFORM FEE</span>
      <span className="detail-value fee">
        {currency.platform_fee}
      </span>
    </div>
  )}
</div>

                {/* Match Actions */}
                <div className="match-actions">
                  <Link to={`/matches/${match.id}`} className="btn-view">
                    <span className="btn-icon">👁️</span>
                    VIEW DETAILS
                  </Link>
                  
                  {/* Join Button for Open Matches */}
                  {canJoinMatch(match) && (
                    <button className="btn-join" onClick={() => joinMatch(match.id)}>
                      <span className="btn-icon">🎮</span>
                      JOIN MATCH
                    </button>
                  )}
                  
                  {/* Accept/Reject for Invitations */}
                  {isInvitation && (
                    <>
                      <button className="btn-accept" onClick={() => acceptMatchInvitation(match.id)}>
                        <span className="btn-icon">✅</span>
                        ACCEPT
                      </button>
                      <button className="btn-reject" onClick={() => rejectMatchInvitation(match.id)}>
                        <span className="btn-icon">❌</span>
                        REJECT
                      </button>
                    </>
                  )}
                  
                  {/* Manage Button for Creator */}
                  {canManageMatch(match) && (
                    <button className="btn-manage" onClick={() => navigate(`/matches/${match.id}`)}>
                      <span className="btn-icon">⚙️</span>
                      MANAGE
                    </button>
                  )}
                </div>

                {/* Invitation Badge */}
                {isInvitation && (
                  <div className="invitation-badge">
                    <span className="badge-icon">🎯</span>
                    <span className="badge-text">MATCH INVITATION!</span>
                    <span className="badge-note">Click Accept to join</span>
                  </div>
                )}

                {/* Custom Prize Badge */}
                {match.prize_pool_option === 'custom' && (
                  <div className="custom-prize-badge">
                    <span className="badge-icon">💰</span>
                    <span className="badge-text">CUSTOM PRIZE</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Matches;