import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { usersAPI, walletAPI } from '../utils/api';
import axios from 'axios';
import './CreateMatch.css';

const CreateMatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    game: 'Call of Duty: Warzone',
    stake_amount: '',
    prize_pool_option: 'entry_fee',
    custom_prize_pool: '',
    opponent_type: 'open',
    specific_username: '',
    scheduled_at: '',
    stake_currency: 'money',
    admin_monitoring: false, // ✅ NEW: XP Admin monitoring checkbox
  });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState({ 
    balance: 0, 
    xp_points: 0, 
    xp_rate: { xp_per_unit: 25, unit_amount: 1000 } 
  });
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [suggestedPlayers, setSuggestedPlayers] = useState([]); // ✅ NEW: Suggested players
  const [loadingSuggested, setLoadingSuggested] = useState(false);

  // Fetch wallet balance on component mount
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  // ✅ NEW: Fetch suggested players when opponent_type is open
  useEffect(() => {
    if (formData.opponent_type === 'open') {
      fetchSuggestedPlayers();
    } else {
      setSuggestedPlayers([]);
    }
  }, [formData.opponent_type, formData.game, formData.stake_currency, formData.stake_amount]);

  // Function to fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      const response = await walletAPI.getBalance();
      if (response.success) {
        setWalletBalance({
          balance: response.balance || 0,
          xp_points: response.xp_points || 0,
          xp_rate: response.xp_rate || { xp_per_unit: 25, unit_amount: 1000 }
        });
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  // ✅ NEW: Function to fetch suggested players
  const fetchSuggestedPlayers = async () => {
    // Only fetch if we have a game selected
    if (!formData.game || formData.opponent_type !== 'open') return;
    
    setLoadingSuggested(true);
    try {
      // This would call a backend endpoint for suggested players
      // For now, we'll simulate with a mock API or use existing users
      const response = await usersAPI.getSuggestedPlayers({
        game: formData.game,
        stake_currency: formData.stake_currency,
        stake_amount: formData.stake_amount || 0,
        exclude_user: user?.id
      });
      
      if (response.success) {
        setSuggestedPlayers(response.players || []);
      }
    } catch (error) {
      console.error('Error fetching suggested players:', error);
      // Fallback: Show some mock suggestions
      setSuggestedPlayers([
        { id: 4, username: 'lenovo', rank: 'D', wins: 29, win_rate: 80.6 },
        { id: 14, username: 'pufpuf', rank: 'E', wins: 4, win_rate: 50.0 },
        { id: 8, username: 'destroyer', rank: 'E', wins: 6, win_rate: 28.6 },
        { id: 12, username: 'kratos', rank: 'E', wins: 2, win_rate: 40.0 },
      ]);
    } finally {
      setLoadingSuggested(false);
    }
  };

  // Convert XP to money equivalent
  const convertXpToMoney = (xpAmount) => {
    const { xp_per_unit, unit_amount } = walletBalance.xp_rate;
    return Math.floor((xpAmount / xp_per_unit) * unit_amount);
  };

  // Convert money to XP equivalent
  const convertMoneyToXp = (moneyAmount) => {
    const { xp_per_unit, unit_amount } = walletBalance.xp_rate;
    return Math.floor((moneyAmount / unit_amount) * xp_per_unit);
  };

  // Get display amount based on currency
  const getDisplayAmount = (amount) => {
    if (formData.stake_currency === 'xp') {
      return `${parseFloat(amount).toLocaleString()} XP`;
    }
    return `₦${parseFloat(amount).toLocaleString()}`;
  };

  // Get equivalent display
  const getEquivalentDisplay = () => {
    if (!formData.stake_amount) return '';
    
    const amount = parseFloat(formData.stake_amount);
    if (formData.stake_currency === 'money') {
      const xpEquivalent = convertMoneyToXp(amount);
      return `≈ ${xpEquivalent.toLocaleString()} XP`;
    } else {
      const moneyEquivalent = convertXpToMoney(amount);
      return `≈ ₦${moneyEquivalent.toLocaleString()}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate based on stake currency
      if (formData.stake_currency === 'money') {
        // Money validation
        if (parseFloat(formData.stake_amount) < 100) {
          alert('Minimum stake amount is ₦100 for money');
          setLoading(false);
          return;
        }
      } else {
        // XP validation
        const minXp = convertMoneyToXp(100); // Equivalent to ₦100
        if (parseFloat(formData.stake_amount) < minXp) {
          alert(`Minimum stake amount is ${minXp} XP (equivalent to ₦100)`);
          setLoading(false);
          return;
        }
      }

      // ========== ADDED: CUSTOM PRIZE POOL VALIDATION ==========
      if (formData.prize_pool_option === 'custom') {
        // 1. Check if custom prize pool is provided
        if (!formData.custom_prize_pool || parseFloat(formData.custom_prize_pool) <= 0) {
          alert('Custom prize pool amount is required');
          setLoading(false);
          return;
        }
        
        // 2. Check if custom prize pool is at least stake amount
        if (parseFloat(formData.custom_prize_pool) < parseFloat(formData.stake_amount)) {
          alert('Custom prize pool cannot be less than stake amount');
          setLoading(false);
          return;
        }
        
        // 3. NEW VALIDATION: Custom prize must be greater than entry fee × 2
        const totalStakes = parseFloat(formData.stake_amount) * 2;
        if (parseFloat(formData.custom_prize_pool) <= totalStakes) {
          alert(`Custom prize pool must be GREATER than ${totalStakes} (entry fee × 2)`);
          setLoading(false);
          return;
        }
      }

      const payload = {
        game: formData.game,
        stake_amount: parseFloat(formData.stake_amount),
        prize_pool_option: formData.prize_pool_option,
        custom_prize_pool: formData.prize_pool_option === 'custom' ? 
          parseFloat(formData.custom_prize_pool) : null,
        opponent_type: formData.opponent_type,
        specific_username: formData.opponent_type === 'specific' ? formData.specific_username : null,
        scheduled_at: formData.scheduled_at || null,
        stake_currency: formData.stake_currency,
        admin_monitoring: formData.admin_monitoring, // ✅ NEW: Include admin monitoring preference
      };

      console.log('Creating match with payload:', payload);

      const response = await api.post('/matches/create', payload);
      
      if (response.success) {
        alert(response.message);
        
        if (response.matchId) {
          console.log('Navigating to match:', response.matchId);
          navigate(`/matches/${response.matchId}`);
        } else {
          console.error('No matchId returned from API');
          navigate('/matches');
        }
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert(error.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear selected user when switching opponent type
    if (name === 'opponent_type') {
      setSelectedUser(null);
      setFormData(prev => ({
        ...prev,
        specific_username: ''
      }));
    }
  };

  const handleUserSearch = async (username) => {
    if (username.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await usersAPI.search(username);
      
      console.log('Search response:', response);
      
      if (response && response.success && response.users) {
        setSearchResults(response.users);
      } else if (response && Array.isArray(response)) {
        setSearchResults(response);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      console.error('Error details:', error.data);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleUsernameSearch = (e) => {
    const username = e.target.value;
    setFormData({
      ...formData,
      specific_username: username
    });
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleUserSearch(username);
    }, 300);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      specific_username: user.username
    });
    setSearchResults([]);
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setFormData({
      ...formData,
      specific_username: ''
    });
  };

  // ✅ NEW: Function to select suggested player
  const selectSuggestedPlayer = (player) => {
    setFormData({
      ...formData,
      opponent_type: 'specific',
      specific_username: player.username
    });
    setSelectedUser(player);
  };

  // ✅ NEW: Function to invite suggested player
  const inviteSuggestedPlayer = (player) => {
    if (window.confirm(`Invite ${player.username} to this match?`)) {
      setFormData({
        ...formData,
        opponent_type: 'specific',
        specific_username: player.username
      });
      setSelectedUser(player);
    }
  };

  return (
    <div className="create-match-container">
      <div className="create-match-card">
        <h2>Create 1v1 Match</h2>
        
        {/* Balance Display */}
        <div className="balance-display">
          <div className="balance-item">
            <span className="balance-label">Cash Balance:</span>
            <span className="balance-value">₦{walletBalance.balance.toLocaleString()}</span>
          </div>
          <div className="balance-item">
            <span className="balance-label">XP Points:</span>
            <span className="balance-value">{walletBalance.xp_points.toLocaleString()} XP</span>
          </div>
          <div className="balance-item">
            <span className="balance-label">Exchange Rate:</span>
            <span className="balance-value">₦{walletBalance.xp_rate.unit_amount} = {walletBalance.xp_rate.xp_per_unit} XP</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="match-form">
          {/* Game Selection */}
          <div className="form-group">
            <label>Game *</label>
            <select 
              name="game" 
              value={formData.game} 
              onChange={handleChange}
              required
            >
              <option value="Call of Duty: Warzone">Call of Duty: Warzone</option>
              <option value="PUBG">PUBG</option>
              <option value="Free Fire">Free Fire</option>
              <option value="Fortnite">Fortnite</option>
              <option value="Valorant">Valorant</option>
              <option value="Dota 2">Dota 2</option>
              <option value="FIFA 23">FIFA 23</option>
              <option value="Call of Duty: Mobile">Call of Duty: Mobile</option>
            </select>
          </div>

          {/* Stake Currency Selection */}
          <div className="form-group">
            <label>Stake Currency *</label>
            <div className="currency-selector">
              <label className={`currency-option ${formData.stake_currency === 'money' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="stake_currency"
                  value="money"
                  checked={formData.stake_currency === 'money'}
                  onChange={handleChange}
                />
                <div className="currency-icon">💰</div>
                <div className="currency-label">Naira (₦)</div>
              </label>
              <label className={`currency-option ${formData.stake_currency === 'xp' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="stake_currency"
                  value="xp"
                  checked={formData.stake_currency === 'xp'}
                  onChange={handleChange}
                />
                <div className="currency-icon">⚡</div>
                <div className="currency-label">XP Points</div>
              </label>
            </div>
          </div>

          {/* Stake Amount */}
          <div className="form-group">
            <label>
              Stake Amount {formData.stake_currency === 'money' ? '(₦)' : '(XP)'} *
            </label>
            <input
              type="number"
              name="stake_amount"
              value={formData.stake_amount}
              onChange={handleChange}
              min={formData.stake_currency === 'money' ? "100" : convertMoneyToXp(100).toString()}
              step={formData.stake_currency === 'money' ? "100" : "10"}
              placeholder={formData.stake_currency === 'money' 
                ? "Enter stake amount (minimum: ₦100)" 
                : `Enter XP amount (minimum: ${convertMoneyToXp(100)} XP ≈ ₦100)`}
              required
            />
            {formData.stake_amount && (
              <div className="currency-equivalent">
                {getEquivalentDisplay()}
              </div>
            )}
          </div>

          {/* Prize Pool Option */}
          <div className="form-group">
            <label>Prize Pool Option</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="prize_pool_option"
                  value="entry_fee"
                  checked={formData.prize_pool_option === 'entry_fee'}
                  onChange={handleChange}
                />
                <span className="radio-label">
                  Use Entry Fee as Prize Pool
                  <small>Prize: 85% of total stakes (15% platform fee)</small>
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="prize_pool_option"
                  value="custom"
                  checked={formData.prize_pool_option === 'custom'}
                  onChange={handleChange}
                />
                <span className="radio-label">
                  Custom Prize Pool
                  <small>Set your own prize amount (must be greater than entry fee × 2)</small>
                </span>
              </label>
            </div>
          </div>

          {formData.prize_pool_option === 'custom' && (
            <div className="form-group">
              <label>
                Custom Prize Pool {formData.stake_currency === 'money' ? '(₦)' : '(XP)'} *
              </label>
              <input
                type="number"
                name="custom_prize_pool"
                value={formData.custom_prize_pool}
                onChange={handleChange}
                min={formData.stake_amount || (formData.stake_currency === 'money' ? 100 : convertMoneyToXp(100))}
                placeholder={`Must be greater than ${getDisplayAmount(
                  formData.stake_amount ? parseFloat(formData.stake_amount) * 2 : 
                  (formData.stake_currency === 'money' ? 200 : convertMoneyToXp(200))
                )}`}
                required
              />
              <small className="hint">
                Must be greater than entry fee × 2 ({getDisplayAmount(
                  formData.stake_amount ? parseFloat(formData.stake_amount) * 2 : 
                  (formData.stake_currency === 'money' ? 200 : convertMoneyToXp(200))
                )})
              </small>
            </div>
          )}

          {/* ✅ NEW: XP Admin Monitoring Checkbox */}
          <div className="form-group">
            <div className="checkbox-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="admin_monitoring"
                  checked={formData.admin_monitoring}
                  onChange={handleChange}
                />
                <div className="checkbox-content">
                  <div className="checkbox-label">
                    <span className="label-icon">👁️</span>
                    <span className="label-text">Allow XP Admin to monitor your match</span>
                  </div>
                  <small className="checkbox-description">
                    Recommended for fair play with unknown opponents. If selected OR match is open, 
                    XP admin will handle result submission to prevent disputes.
                  </small>
                </div>
              </label>
            </div>
          </div>

          {/* Opponent Type */}
          <div className="form-group">
            <label>Choose Opponent *</label>
            <div className="opponent-type-selector">
              <div className="opponent-option">
                <input
                  type="radio"
                  name="opponent_type"
                  value="open"
                  id="open-match"
                  checked={formData.opponent_type === 'open'}
                  onChange={handleChange}
                />
                <label htmlFor="open-match" className="opponent-label">
                  <div className="option-icon">🌐</div>
                  <div className="option-content">
                    <div className="option-title">Open Challenge</div>
                    <div className="option-description">
                      Anyone can join your match. Perfect for quick games!
                    </div>
                  </div>
                </label>
              </div>

              <div className="opponent-option">
                <input
                  type="radio"
                  name="opponent_type"
                  value="specific"
                  id="specific-player"
                  checked={formData.opponent_type === 'specific'}
                  onChange={handleChange}
                />
                <label htmlFor="specific-player" className="opponent-label">
                  <div className="option-icon">🎯</div>
                  <div className="option-content">
                    <div className="option-title">Specific Player</div>
                    <div className="option-description">
                      Challenge a specific player by username
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ✅ NEW: Suggested Players Section (only shown for open matches) */}
          {formData.opponent_type === 'open' && suggestedPlayers.length > 0 && (
            <div className="form-group suggested-players-section">
              <label>Suggested Players</label>
              <div className="suggested-players">
                <p className="suggested-players-note">
                  💡 Invite these active players for quicker match acceptance:
                </p>
                <div className="suggested-players-list">
                  {suggestedPlayers.map(player => (
                    <div key={player.id} className="suggested-player-card">
                      <div className="suggested-player-info">
                        <div className="player-avatar">
                          {player.profile_pic && player.profile_pic !== 'default.png' ? (
                            <img src={`/uploads/${player.profile_pic}`} alt={player.username} />
                          ) : (
                            <span>{player.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="player-details">
                          <div className="player-username">{player.username}</div>
                          <div className="player-stats">
                            <span className="player-rank">Rank: {player.rank || 'E'}</span>
                            <span className="player-wins">Wins: {player.wins || 0}</span>
                            <span className="player-winrate">WR: {player.win_rate || 0}%</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="invite-player-btn"
                        onClick={() => inviteSuggestedPlayer(player)}
                      >
                        <span className="btn-icon">🎯</span>
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
                <p className="suggested-players-footer">
                  These players are active and match your game preference.
                </p>
              </div>
            </div>
          )}

          {/* Specific Player Search */}
          {formData.opponent_type === 'specific' && (
            <div className="form-group">
              <label>Search Player by Username *</label>
              
              {selectedUser ? (
                <div className="selected-user">
                  <div className="selected-user-info">
                    <span className="username">{selectedUser.username}</span>
                    <span className="rank">Rank: {selectedUser.rank || 'E'}</span>
                    <span className="matches">Wins: {selectedUser.wins || 0}</span>
                  </div>
                  <button 
                    type="button" 
                    className="clear-selection"
                    onClick={clearSelection}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    name="specific_username"
                    value={formData.specific_username}
                    onChange={handleUsernameSearch}
                    placeholder="Enter username to search..."
                    className="user-search-input"
                    required
                  />
                  
                  {searching && (
                    <div className="search-loading">Searching users...</div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(user => (
                        <div 
                          key={user.id}
                          className="search-result-item"
                          onClick={() => selectUser(user)}
                        >
                          <div className="user-avatar">
                            {user.profile_pic && user.profile_pic !== 'default.png' ? (
                              <img src={`/uploads/${user.profile_pic}`} alt={user.username} />
                            ) : (
                              user.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="user-details">
                            <div className="user-username">{user.username}</div>
                            <div className="user-stats">
                              Rank: {user.rank || 'E'} • Wins: {user.wins || 0} • WR: {user.win_rate || 0}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.specific_username && searchResults.length === 0 && !searching && (
                    <div className="no-results">No users found with that username</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Schedule */}
          <div className="form-group">
            <label>Schedule Match (Optional)</label>
            <input
              type="datetime-local"
              name="scheduled_at"
              value={formData.scheduled_at}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
            />
            <small className="hint">
              Leave empty to start immediately when opponent joins
            </small>
          </div>

          {/* Match Summary */}
          <div className="match-summary">
            <h4>Match Summary</h4>
            <div className="summary-item">
              <span>Game:</span>
              <span>{formData.game}</span>
            </div>
            <div className="summary-item">
              <span>Stake (per player):</span>
              <span>{getDisplayAmount(formData.stake_amount || '0')}</span>
            </div>
            <div className="summary-item">
              <span>Currency:</span>
              <span>{formData.stake_currency === 'money' ? 'Naira (₦)' : 'XP Points'}</span>
            </div>
            <div className="summary-item">
              <span>Total Stakes (both players):</span>
              <span>
                {formData.stake_amount ? 
                  getDisplayAmount((parseFloat(formData.stake_amount) * 2).toFixed(2)) 
                  : '0'}
              </span>
            </div>
            
            {/* ✅ NEW: Admin Monitoring Status */}
            <div className="summary-item">
              <span>Admin Monitoring:</span>
              <span className={formData.admin_monitoring ? 'admin-monitoring-on' : 'admin-monitoring-off'}>
                {formData.admin_monitoring ? 'ENABLED' : 'Disabled'}
                {formData.admin_monitoring && ' 👁️'}
              </span>
            </div>
            
            {formData.prize_pool_option === 'entry_fee' ? (
              <>
                <div className="summary-item">
                  <span>Platform Fee:</span>
                  <span>
                    {formData.stake_currency === 'money' && formData.stake_amount ? 
                      `₦${(parseFloat(formData.stake_amount) * 2 * 0.15).toFixed(2)} (15%)` 
                      : '0 (XP matches have no fee)'}
                  </span>
                </div>
                <div className="summary-item prize">
                  <span>Prize Pool:</span>
                  <span>
                    {formData.stake_amount ? 
                      getDisplayAmount(
                        formData.stake_currency === 'money' 
                          ? (parseFloat(formData.stake_amount) * 2 * 0.85).toFixed(2)
                          : (parseFloat(formData.stake_amount) * 2).toFixed(2)
                      ) 
                      : '0'}
                    {formData.stake_currency === 'money' ? ' (85% of total)' : ' (100% of total)'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="summary-item">
                  <span>Custom Prize Pool:</span>
                  <span className="highlight">
                    {getDisplayAmount(formData.custom_prize_pool || '0')}
                  </span>
                </div>
                <div className="summary-item">
                  <span>Platform Fee:</span>
                  <span>
                    {formData.stake_currency === 'money' && formData.custom_prize_pool ? 
                      `₦${(parseFloat(formData.custom_prize_pool) * 0.15).toFixed(2)} (15% of custom prize)` 
                      : '0 (XP matches have no fee)'}
                  </span>
                </div>
                <div className="summary-item prize">
                  <span>Winner Gets:</span>
                  <span>
                    {getDisplayAmount(
                      formData.custom_prize_pool && formData.stake_currency === 'money' 
                        ? (parseFloat(formData.custom_prize_pool) * 0.85).toFixed(2)
                        : (formData.custom_prize_pool || '0')
                    )}
                    {formData.stake_currency === 'money' ? ' (85% of custom prize)' : ''}
                  </span>
                </div>
              </>
            )}
          </div>

          <button 
            type="submit" 
            className="create-match-btn"
            disabled={loading || (formData.opponent_type === 'specific' && !selectedUser) || balanceLoading}
          >
            {loading ? 'Creating Match...' : 'Create Match Challenge'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateMatch;