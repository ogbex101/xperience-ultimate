import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OpenChallenges.css';

const OpenChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    game: '',
    minStake: '',
    maxStake: ''
  });

  useEffect(() => {
    fetchOpenChallenges();
  }, []);

  const fetchOpenChallenges = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/matches/open');
      const data = await response.json();
      
      if (data.success) {
        // Filter only open matches (player2_id is null and status is pending)
        const openMatches = data.matches.filter(match => 
          !match.player2_id && match.status === 'pending'
        );
        setChallenges(openMatches);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (matchId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/matches/${matchId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Successfully joined the match!');
        fetchOpenChallenges(); // Refresh the list
      } else {
        alert(data.message || 'Failed to join match');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      alert('Error joining challenge');
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (filters.game && challenge.game !== filters.game) return false;
    if (filters.minStake && challenge.stake_amount < parseFloat(filters.minStake)) return false;
    if (filters.maxStake && challenge.stake_amount > parseFloat(filters.maxStake)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="open-challenges-container">
        <div className="loading-spinner">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="open-challenges-container">
      <div className="challenges-header">
        <h1>🎮 Open Challenges</h1>
        <p>Join available matches and compete against other players</p>
      </div>

      {/* Filters */}
      <div className="challenges-filters">
        <div className="filter-group">
          <label>Game:</label>
          <select 
            value={filters.game} 
            onChange={(e) => setFilters({...filters, game: e.target.value})}
          >
            <option value="">All Games</option>
            <option value="Call of Duty: Warzone">Call of Duty: Warzone</option>
            <option value="Fortnite">Fortnite</option>
            <option value="PUBG">PUBG</option>
            <option value="Valorant">Valorant</option>
            <option value="Free Fire">Free Fire</option>
            <option value="Call of Duty: Mobile">Call of Duty: Mobile</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Min Stake:</label>
          <input
            type="number"
            placeholder="Min"
            value={filters.minStake}
            onChange={(e) => setFilters({...filters, minStake: e.target.value})}
          />
        </div>

        <div className="filter-group">
          <label>Max Stake:</label>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxStake}
            onChange={(e) => setFilters({...filters, maxStake: e.target.value})}
          />
        </div>

        <button 
          className="clear-filters"
          onClick={() => setFilters({ game: '', minStake: '', maxStake: '' })}
        >
          Clear Filters
        </button>
      </div>

      {/* Challenges List */}
      <div className="challenges-list">
        {filteredChallenges.length === 0 ? (
          <div className="no-challenges">
            <h3>No open challenges available</h3>
            <p>Be the first to create a challenge or check back later!</p>
            <Link to="/create-match" className="create-challenge-btn">
              Create Challenge
            </Link>
          </div>
        ) : (
          filteredChallenges.map(challenge => (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-info">
                <div className="game-header">
                  <h3>{challenge.game}</h3>
                  <span className="stake-amount">₦{challenge.stake_amount}</span>
                </div>
                
                <div className="challenge-details">
                  <div className="detail-item">
                    <span className="label">Creator:</span>
                    <span className="value">{challenge.creator_username}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="label">Prize Pool:</span>
                    <span className="value prize-pool">₦{challenge.prize_pool_amount}</span>
                  </div>

                  <div className="detail-item">
                    <span className="label">Type:</span>
                    <span className="value">{challenge.prize_pool_option === 'custom' ? 'Custom Prize' : 'Entry Fee Prize'}</span>
                  </div>

                  {challenge.scheduled_at && (
                    <div className="detail-item">
                      <span className="label">Scheduled:</span>
                      <span className="value">{new Date(challenge.scheduled_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="challenge-actions">
                  <button 
                    className="join-btn"
                    onClick={() => joinChallenge(challenge.id)}
                  >
                    Join Challenge
                  </button>
                  
                  <Link 
                    to={`/match/${challenge.id}`}
                    className="view-details-btn"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              <div className="challenge-stats">
                <div className="stat">
                  <span className="stat-value">{challenge.creator_rank}</span>
                  <span className="stat-label">Rank</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{challenge.creator_win_rate}%</span>
                  <span className="stat-label">Win Rate</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OpenChallenges;