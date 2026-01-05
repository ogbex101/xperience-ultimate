import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { matchesAPI } from '../utils/api'; // Import matchesAPI
import socketService from '../services/socketService';
import './MatchDetails.css';

const MatchDetails = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  
  // CHAT STATE
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    fetchMatchDetails();
    fetchMatchChat();
    
    // Connect to socket with delay to ensure auth is ready
    const socketTimer = setTimeout(() => {
      connectSocket();
    }, 1000);
    
    // Clean up on unmount
    return () => {
      clearTimeout(socketTimer);
      // Only disconnect if socket is connected
      if (isSocketConnected) {
        disconnectSocket();
      }
    };
  }, [matchId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const connectSocket = async () => {
    try {
      console.log('🔌 Connecting socket for match chat...');
      await socketService.connect();
      
      // Check if socket is actually connected
      const status = socketService.getStatus();
      setIsSocketConnected(status.isConnected);
      
      if (!status.isConnected) {
        console.warn('⚠️ Socket not connected, will retry...');
        return;
      }
      
      console.log('✅ Socket connected for match chat');
      
      // Listen for match chat messages
      socketService.onMatchChatMessage(matchId, handleMatchChatMessage);
      
      // Listen for other events
      socketService.addEventListener('match_user_typing', handleUserTyping);
      socketService.addEventListener('match_system_message', handleSystemMessage);
      socketService.addEventListener('user_joined_chat', handleUserJoined);
      socketService.addEventListener('user_left_chat', handleUserLeft);
      socketService.addEventListener('match_updated', handleMatchUpdate);
      
      // Join the match chat
      socketService.joinMatchChat(matchId);
      
    } catch (error) {
      console.error('❌ Failed to connect socket:', error);
      setIsSocketConnected(false);
    }
  };

  const disconnectSocket = () => {
    try {
      // Only leave chat if socket is connected
      if (isSocketConnected) {
        socketService.leaveMatchChat(matchId);
      }
      socketService.offMatchChatMessage(matchId);
      socketService.removeEventListener('match_user_typing', handleUserTyping);
      socketService.removeEventListener('match_system_message', handleSystemMessage);
      socketService.removeEventListener('user_joined_chat', handleUserJoined);
      socketService.removeEventListener('user_left_chat', handleUserLeft);
      socketService.removeEventListener('match_updated', handleMatchUpdate);
    } catch (error) {
      console.error('Error disconnecting socket:', error);
    }
  };

  const handleMatchChatMessage = useCallback((data) => {
    console.log('🔍🔍🔍 DEBUG MatchDetails handleMatchChatMessage START 🔍🔍🔍');
    console.log('🔍 DEBUG - Raw data received:', data);
    console.log('🔍 DEBUG - Type of data:', typeof data);
    
    if (data && typeof data === 'object') {
      console.log('🔍 DEBUG - Data keys:', Object.keys(data));
      console.log('🔍 DEBUG - created_at:', data.created_at, 'Type:', typeof data.created_at);
      console.log('🔍 DEBUG - username:', data.username);
      console.log('🔍 DEBUG - message:', data.message);
      console.log('🔍 DEBUG - is_current_user:', data.is_current_user);
      console.log('🔍 DEBUG - user_id:', data.user_id);
      console.log('🔍 DEBUG - match_id:', data.match_id);
      console.log('🔍 DEBUG - rank:', data.rank);
      console.log('🔍 DEBUG - profile_pic:', data.profile_pic);
      
      // Validate date
      if (data.created_at) {
        const date = new Date(data.created_at);
        console.log('🔍 DEBUG - Date valid?', !isNaN(date.getTime()));
      }
    } else {
      console.error('🔍 DEBUG - Invalid data received:', data);
      return;
    }
    
    console.log('🔍🔍🔍 DEBUG MatchDetails handleMatchChatMessage END 🔍🔍🔍');
    
    // Handle both nested and direct message structures
    let messageData;
    if (data && typeof data === 'object') {
      if (data.message && typeof data.message === 'object') {
        // Nested structure: { type: 'match_chat_message', message: {...} }
        messageData = data.message;
        console.log('📦 Received nested message structure');
      } else if (data.match_id || data.user_id) {
        // Direct structure: {...message fields...}
        messageData = data;
        console.log('📤 Received direct message structure');
      } else {
        console.error('❌ Invalid message structure:', data);
        return;
      }
    } else {
      console.error('❌ Invalid message data:', data);
      return;
    }
    
    // Generate unique ID for the message
    const uniqueId = messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('✅ Adding message to chat:', {
      id: uniqueId,
      username: messageData.username,
      message: messageData.message,
      is_current_user: messageData.is_current_user
    });
    
    // Add message to chat
    setChatMessages(prev => [...prev, { ...messageData, id: uniqueId }]);
  }, []);

  const handleUserTyping = useCallback((data) => {
    if (data.matchId === matchId && data.userId !== user?.id) {
      setOtherUserTyping(true);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        setOtherUserTyping(false);
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  }, [matchId, user?.id, typingTimeout]);

  const handleSystemMessage = useCallback((data) => {
    if (data.matchId === matchId) {
      // Generate unique ID for system message
      const uniqueId = `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const systemMessage = {
        id: uniqueId,
        match_id: matchId,
        user_id: 0,
        username: 'System',
        message: data.message,
        created_at: data.timestamp || new Date().toISOString(),
        is_system: 1,
        is_current_user: 0
      };
      
      setChatMessages(prev => [...prev, systemMessage]);
    }
  }, [matchId]);

  const handleUserJoined = useCallback((data) => {
    if (data.matchId === matchId && data.userId !== user?.id) {
      // Generate unique ID for join message
      const uniqueId = `system_join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const joinMessage = {
        id: uniqueId,
        match_id: matchId,
        user_id: 0,
        username: 'System',
        message: `${data.username || 'User'} joined the chat`,
        created_at: new Date().toISOString(),
        is_system: 1,
        is_current_user: 0
      };
      
      setChatMessages(prev => [...prev, joinMessage]);
    }
  }, [matchId, user?.id]);

  const handleUserLeft = useCallback((data) => {
    if (data.matchId === matchId && data.userId !== user?.id) {
      // Generate unique ID for leave message
      const uniqueId = `system_leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const leaveMessage = {
        id: uniqueId,
        match_id: matchId,
        user_id: 0,
        username: 'System',
        message: `${data.username || 'User'} left the chat${data.reason ? ` (${data.reason})` : ''}`,
        created_at: new Date().toISOString(),
        is_system: 1,
        is_current_user: 0
      };
      
      setChatMessages(prev => [...prev, leaveMessage]);
    }
  }, [matchId, user?.id]);

  const handleMatchUpdate = useCallback((data) => {
    if (data.matchId === matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  const handleTyping = () => {
    if (match && (match.status === 'ongoing' || match.status === 'pending_confirmation')) {
      if (isSocketConnected) {
        socketService.sendMatchTypingIndicator(matchId, true);
      }
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (isSocketConnected) {
          socketService.sendMatchTypingIndicator(matchId, false);
        }
      }, 1000);
      
      setTypingTimeout(timeout);
    }
  };

  const fetchMatchDetails = async () => {
    try {
      console.log(`📋 Fetching match details for ID: ${matchId}`);
      const response = await matchesAPI.getMatchDetails(matchId); // Use matchesAPI
      if (response.success) {
        setMatch(response.match);
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
      // Show error but don't block UI
      if (error.status === 404) {
        setMatch(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchChat = async () => {
    try {
      setChatLoading(true);
      console.log(`💬 Fetching match chat for ID: ${matchId}`);
      const response = await matchesAPI.getMatchChat(matchId); // Use matchesAPI
      if (response.success) {
        setChatMessages(response.messages || []);
      }
    } catch (error) {
      console.error('Error fetching match chat:', error);
      // If API fails, start with empty chat
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      // Generate unique temp ID
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const tempMessage = {
        id: tempId,
        match_id: matchId,
        user_id: user?.id,
        username: user?.username,
        profile_pic: user?.profile_pic || 'default.png',
        rank: user?.rank || 'E',
        is_admin: user?.is_admin || false,
        message: newMessage,
        created_at: new Date().toISOString(),
        is_current_user: 1,
        is_system: 0,
        tempId: tempId
      };
      
      // Add temp message immediately for optimistic update
      setChatMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // Try to send via socket first
      if (isSocketConnected) {
        const socketSuccess = socketService.sendMatchChatMessage(matchId, newMessage, tempId);
        
        if (!socketSuccess) {
          // Fallback to API if socket fails
          await matchesAPI.sendMatchChat(matchId, newMessage); // Use matchesAPI
        }
      } else {
        // Use API if socket is not connected
        await matchesAPI.sendMatchChat(matchId, newMessage); // Use matchesAPI
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error.message || 'Unknown error'));
    } finally {
      setSendingMessage(false);
    }
  };

  const acceptInvitation = async () => {
    try {
      if (!match) return;
      
      const stakeAmount = match.stake_currency === 'money' 
        ? `₦${parseFloat(match.stake_amount).toLocaleString()}` 
        : `${match.stake_amount} XP`;
      
      const confirmAccept = window.confirm(
        `Accept this match invitation?\n\n` +
        `Game: ${match.game}\n` +
        `Stake: ${stakeAmount}\n` +
        `Opponent: ${match.player1_username}\n\n` +
        `The stake amount will be deducted from your balance.`
      );
      
      if (!confirmAccept) return;

      const response = await matchesAPI.acceptInvitation(matchId); // Use matchesAPI
      if (response.success) {
        alert('✅ Match accepted successfully! Game is now active.');
        fetchMatchDetails();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert(error.message || 'Failed to accept match');
    }
  };

  const declineInvitation = async () => {
    try {
      const confirmReject = window.confirm('Decline this match invitation?');
      if (!confirmReject) return;

      const response = await matchesAPI.declineInvitation(matchId); // Use matchesAPI
      if (response.success) {
        alert('Invitation declined.');
        navigate('/matches');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert(error.message || 'Failed to decline invitation');
    }
  };

  const joinMatch = async () => {
    try {
      if (!match) return;
      
      const stakeAmount = match.stake_currency === 'money' 
        ? `₦${parseFloat(match.stake_amount).toLocaleString()}` 
        : `${match.stake_amount} XP`;
      
      const confirmJoin = window.confirm(
        `Join this match?\n\n` +
        `Game: ${match.game}\n` +
        `Stake: ${stakeAmount}\n` +
        `Opponent: ${match.player1_username}\n\n` +
        `The stake amount will be deducted from your balance.`
      );
      
      if (!confirmJoin) return;

      const response = await matchesAPI.joinMatch(matchId); // Use matchesAPI
      if (response.success) {
        alert('✅ Successfully joined the match!');
        fetchMatchDetails();
      }
    } catch (error) {
      console.error('Error joining match:', error);
      alert(error.message || 'Failed to join match');
    }
  };

  const submitResult = async () => {
    if (!selectedWinner) {
      alert('Please select a winner');
      return;
    }

    try {
      setSubmitting(true);
      const response = await matchesAPI.submitResult(matchId, parseInt(selectedWinner)); // Use matchesAPI

      if (response.success) {
        alert('✅ Result submitted! ' + response.message);
        fetchMatchDetails();
        setSelectedWinner('');
      }
    } catch (error) {
      console.error('Error submitting result:', error);
      alert(error.message || 'Failed to submit result');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmResult = async (confirmed) => {
    try {
      setConfirming(true);
      const response = await matchesAPI.confirmResult(matchId, confirmed); // Use matchesAPI

      if (response.success) {
        if (confirmed) {
          alert('✅ Result confirmed! ' + (response.message || ''));
          if (response.winner) {
            const prizeDisplay = match.stake_currency === 'money' 
              ? `₦${response.prize}` 
              : `${response.prize} XP`;
            alert(`🎉 Winner: ${response.winner}\n💰 Prize: ${prizeDisplay}`);
          }
        } else {
          alert('⚠️ Result contested. Admin will review the dispute.');
        }
        fetchMatchDetails();
      }
    } catch (error) {
      console.error('Error confirming result:', error);
      alert(error.message || 'Failed to process confirmation');
    } finally {
      setConfirming(false);
    }
  };

  const cancelMatch = async () => {
    if (!window.confirm('Are you sure you want to cancel this match?')) return;

    try {
      const response = await matchesAPI.cancelMatch(matchId); // Use matchesAPI
      if (response.success) {
        alert('Match cancelled successfully.');
        navigate('/matches');
      }
    } catch (error) {
      console.error('Error cancelling match:', error);
      alert(error.message || 'Failed to cancel match');
    }
  };

  const getCurrencyDisplay = (match) => {
    if (!match) return null;
    
    const individualStake = match.individual_stake || match.stake_amount;
    const totalStakes = match.total_stakes || (match.stake_amount * 2);
    const platformFee = match.platform_fee || 0;
    const prizePool = match.prize_pool_amount;
    
    const formatMoney = (amount) => {
      return `₦${parseFloat(amount).toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    };
    
    const formatXP = (amount) => {
      return `${parseFloat(amount).toLocaleString()} XP`;
    };
    
    if (match.stake_currency === 'xp') {
      return {
        individual_stake: formatXP(individualStake),
        total_stakes: formatXP(totalStakes),
        prize_pool: formatXP(prizePool),
        platform_fee: '0 XP',
        symbol: '⚡',
        type: 'XP'
      };
    } else {
      return {
        individual_stake: formatMoney(individualStake),
        total_stakes: formatMoney(totalStakes),
        prize_pool: formatMoney(prizePool),
        platform_fee: formatMoney(platformFee),
        symbol: '💰',
        type: 'Money'
      };
    }
  };

  const getStatusIcon = () => {
    if (!match) return '❓';
    switch(match.status) {
      case 'pending': return '⏳';
      case 'ongoing': return '⚡';
      case 'completed': return '🏆';
      case 'pending_confirmation': return '🔄';
      case 'disputed': return '⚖️';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = () => {
    if (!match) return '';
    switch(match.status) {
      case 'pending': return 'status-pending';
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      case 'pending_confirmation': return 'status-pending-confirm';
      case 'disputed': return 'status-disputed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const ChatMessage = ({ message }) => {
    const isCurrentUser = message.is_current_user === 1 || message.user_id === user?.id;
    const isSystem = message.is_system === 1;
    const isAdmin = message.is_admin === 1;
    
    // Safe date formatting
    const getFormattedTime = (dateString) => {
      if (!dateString) return 'Just now';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Just now';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        return 'Just now';
      }
    };
    
    const getProfilePicUrl = (profilePic) => {
      if (!profilePic || profilePic === 'default.png') {
        return null;
      }
      return `/uploads/${profilePic}`;
    };
    
    // Handle image error
    const handleImageError = (e) => {
      e.target.style.display = 'none';
      const fallback = e.target.nextElementSibling;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    };
    
    if (isSystem) {
      return (
        <div className="chat-message system">
          <div className="system-content">
            <span className="system-icon">📢</span>
            <span className="system-text">{message.message}</span>
          </div>
          <div className="message-time">
            {getFormattedTime(message.created_at)}
          </div>
        </div>
      );
    }
    
    const profilePicUrl = getProfilePicUrl(message.profile_pic);
    const userProfilePicUrl = getProfilePicUrl(user?.profile_pic);
    const safeUsername = message.username || 'User';
    const safeRank = message.rank || 'E';
    
    return (
      <div className={`chat-message ${isCurrentUser ? 'outgoing' : 'incoming'}`}>
        {!isCurrentUser && (
          <div className="message-avatar">
            {profilePicUrl ? (
              <img 
                src={profilePicUrl} 
                alt={safeUsername}
                onError={handleImageError}
              />
            ) : null}
            <div className="avatar-fallback">
              <span>{safeUsername.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        )}
        
        <div className="message-content">
          {!isCurrentUser && (
            <div className="message-header">
              <span className="message-username">{safeUsername}</span>
              {isAdmin && <span className="admin-badge">ADMIN</span>}
              <span className="message-rank">{safeRank}</span>
            </div>
          )}
          
          <div className="message-bubble">
            <p>{message.message || ''}</p>
          </div>
          
          <div className="message-footer">
            <span className="message-time">
              {getFormattedTime(message.created_at)}
            </span>
            {isCurrentUser && (
              <span className="message-status">
                {message.tempId && message.tempId.startsWith('temp_') ? '🕐' : '✓'}
              </span>
            )}
          </div>
        </div>
        
        {isCurrentUser && (
          <div className="message-avatar">
            {userProfilePicUrl ? (
              <img 
                src={userProfilePicUrl} 
                alt={user?.username}
                onError={handleImageError}
              />
            ) : null}
            <div className="avatar-fallback">
              <span>{user?.username ? user.username.charAt(0).toUpperCase() : '?'}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="match-details-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>LOADING MATCH DETAILS...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="match-details-container">
        <div className="error-screen">
          <div className="error-icon">⚠️</div>
          <h2>MATCH NOT FOUND</h2>
          <p>The match you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/matches')} className="btn-neon">
            BACK TO MATCHES
          </button>
        </div>
      </div>
    );
  }

  const isParticipant = match.player1_id === user?.id || match.player2_id === user?.id;
  const isCreator = match.player1_id === user?.id;
  const isOpponent = match.player2_id === user?.id;
  
  const isInvited = match.opponent_type === 'specific' && 
                    match.status === 'pending' && 
                    match.opponent_username === user?.username &&
                    !match.player2_id;

  const canJoin = match.opponent_type === 'open' && 
                  match.status === 'pending' && 
                  !match.player2_id && 
                  !isCreator;

  const canSubmitResult = match.status === 'ongoing' && isParticipant;
  const canConfirmResult = match.status === 'pending_confirmation' && isParticipant;
  const canCancel = match.status === 'pending' && isCreator;

  const currencyDisplay = getCurrencyDisplay(match);

  return (
    <div className="match-details-container">
      <div className="match-header">
        <button onClick={() => navigate('/matches')} className="btn-back">
          <span className="icon">←</span>
          BACK TO MATCHES
        </button>
        
        <div className="match-title">
          <h1>#{match.id} | {match.game}</h1>
          <p className="match-type">
            {match.opponent_type === 'open' ? 'PUBLIC CHALLENGE' : 'PRIVATE MATCH'} • 
            {match.stake_currency === 'money' ? ' MONEY MATCH' : ' XP MATCH'}
          </p>
        </div>
        
        <div className={`match-status ${getStatusColor()}`}>
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{match.status.replace('_', ' ').toUpperCase()}</span>
        </div>
      </div>

      {isInvited && (
        <div className="alert-invitation">
          <div className="alert-content">
            <div className="alert-icon">🎯</div>
            <div className="alert-details">
              <h3>MATCH INVITATION RECEIVED</h3>
              <p>
                <span className="highlight">{match.player1_username}</span> invited you to a 
                <span className="highlight"> {match.game}</span> match
              </p>
              <div className="invite-details">
                <p><strong>Entry Fee:</strong> {currencyDisplay.individual_stake}</p>
                {match.prize_pool_option === 'custom' && match.custom_prize_pool && (
                  <p><strong>Custom Prize:</strong> 
                    {match.stake_currency === 'money' ? '₦' : ''}
                    {parseFloat(match.custom_prize_pool).toLocaleString()}
                    {match.stake_currency === 'xp' ? ' XP' : ''}
                  </p>
                )}
                <p><strong>Type:</strong> {match.prize_pool_option === 'custom' ? 'Custom Prize Match' : 'Entry Fee Match'}</p>
              </div>
              <p className="invite-note">
                ⚠️ Accepting will deduct {currencyDisplay.individual_stake} from your {match.stake_currency === 'money' ? 'balance' : 'XP'}
              </p>
            </div>
          </div>
          <div className="alert-actions">
            <button onClick={acceptInvitation} className="btn-accept">
              <span className="icon">✓</span>
              ACCEPT & PAY
            </button>
            <button onClick={declineInvitation} className="btn-reject">
              <span className="icon">✕</span>
              DECLINE
            </button>
          </div>
        </div>
      )}

      {!isSocketConnected && (
        <div className="socket-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">Real-time chat is not connected. Messages may be delayed.</span>
        </div>
      )}

      <div className="match-stats">
        <div className="stat-item">
          <div className="stat-icon">{currencyDisplay.symbol}</div>
          <div className="stat-info">
            <span className="stat-label">STAKE (PER PLAYER)</span>
            <span className="stat-value">{currencyDisplay.individual_stake}</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">🎮</div>
          <div className="stat-info">
            <span className="stat-label">TOTAL STAKES</span>
            <span className="stat-value">{currencyDisplay.total_stakes}</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <span className="stat-label">PRIZE POOL</span>
            <span className="stat-value">{currencyDisplay.prize_pool}</span>
          </div>
        </div>
        
        {match.stake_currency === 'money' && (
          <div className="stat-item">
            <div className="stat-icon">💼</div>
            <div className="stat-info">
              <span className="stat-label">PLATFORM FEE (15%)</span>
              <span className="stat-value">{currencyDisplay.platform_fee}</span>
            </div>
          </div>
        )}
      </div>

      <div className="match-main-with-chat">
        <div className="match-content-left">
          <div className="section-players">
            <div className="section-title">
              <h2>PLAYERS</h2>
              <div className="match-mode">1 VS 1</div>
            </div>
            
            <div className="players-container">
              <div className={`player-card ${match.winner_id === match.player1_id ? 'winner' : ''}`}>
                <div className="player-header">
                  <div className="player-avatar">
                    {match.player1_profile_pic && match.player1_profile_pic !== 'default.png' ? (
                      <img src={`/uploads/${match.player1_profile_pic}`} alt={match.player1_username} />
                    ) : (
                      <span>{match.player1_username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="player-info">
                    <h3 className="player-name">
                      {match.player1_username}
                      {isCreator && <span className="badge-you">YOU</span>}
                    </h3>
                    <div className="player-meta">
                      <span className="player-rank">{match.player1_rank || 'E'}</span>
                      <span className="player-role">CREATOR</span>
                    </div>
                  </div>
                </div>
                {match.winner_id === match.player1_id && (
                  <div className="player-winner">
                    <span className="winner-icon">👑</span>
                    WINNER
                  </div>
                )}
              </div>

              <div className="vs-container">
                <div className="vs-line"></div>
                <div className="vs-circle">VS</div>
                <div className="vs-line"></div>
              </div>

              {match.player2_id ? (
                <div className={`player-card ${match.winner_id === match.player2_id ? 'winner' : ''}`}>
                  <div className="player-header">
                    <div className="player-avatar">
                      {match.player2_profile_pic && match.player2_profile_pic !== 'default.png' ? (
                        <img src={`/uploads/${match.player2_profile_pic}`} alt={match.player2_username} />
                      ) : (
                        <span>{match.player2_username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="player-info">
                      <h3 className="player-name">
                        {match.player2_username}
                        {isOpponent && <span className="badge-you">YOU</span>}
                      </h3>
                      <div className="player-meta">
                        <span className="player-rank">{match.player2_rank || 'E'}</span>
                        <span className="player-role">OPPONENT</span>
                      </div>
                    </div>
                  </div>
                  {match.winner_id === match.player2_id && (
                    <div className="player-winner">
                      <span className="winner-icon">👑</span>
                      WINNER
                    </div>
                  )}
                </div>
              ) : (
                <div className="player-card empty">
                  <div className="player-avatar empty">?</div>
                  <div className="player-info">
                    <h3 className="player-name">WAITING FOR OPPONENT</h3>
                    <p className="player-invite">
                      {match.opponent_type === 'open' 
                        ? 'OPEN SPOT - ANYONE CAN JOIN' 
                        : `INVITED: ${match.opponent_username}`}
                    </p>
                    {canJoin && (
                      <button onClick={joinMatch} className="btn-join-small">
                        JOIN NOW
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="section-actions">
            <div className="section-title">
              <h2>ACTIONS</h2>
            </div>
            
            <div className="actions-grid">
              {canJoin && (
                <div className="action-card join">
                  <div className="action-icon">🎮</div>
                  <div className="action-content">
                    <h3>JOIN MATCH</h3>
                    <p>Stake required: {currencyDisplay.individual_stake}</p>
                    <p className="action-note">
                      Your {currencyDisplay.type.toLowerCase()} will be deducted upon joining
                    </p>
                  </div>
                  <button onClick={joinMatch} className="btn-action btn-join">
                    JOIN NOW
                  </button>
                </div>
              )}

              {canSubmitResult && (
                <div className="action-card submit">
                  <div className="action-icon">⚔️</div>
                  <div className="action-content">
                    <h3>SUBMIT RESULT</h3>
                    <p>Select the winner of this match</p>
                    <select 
                      value={selectedWinner} 
                      onChange={(e) => setSelectedWinner(e.target.value)}
                      className="select-winner"
                      disabled={submitting}
                    >
                      <option value="">SELECT WINNER</option>
                      <option value={match.player1_id}>{match.player1_username}</option>
                      {match.player2_id && (
                        <option value={match.player2_id}>{match.player2_username}</option>
                      )}
                    </select>
                  </div>
                  <button 
                    onClick={submitResult} 
                    disabled={!selectedWinner || submitting}
                    className="btn-action btn-submit"
                  >
                    {submitting ? 'SUBMITTING...' : 'SUBMIT RESULT'}
                  </button>
                </div>
              )}

              {canConfirmResult && (
                <div className="action-card confirm">
                  <div className="action-icon">🔄</div>
                  <div className="action-content">
                    <h3>CONFIRM RESULT</h3>
                    <p className="winner-info">
                      Winner submitted: <span className="winner-name">{match.winner_username}</span>
                    </p>
                    <p className="prize-info">
                      Prize: <span className="prize-amount">{currencyDisplay.prize_pool}</span>
                    </p>
                  </div>
                  <div className="confirm-buttons">
                    <button 
                      onClick={() => confirmResult(true)} 
                      disabled={confirming}
                      className="btn-action btn-confirm"
                    >
                      {confirming ? 'CONFIRMING...' : 'CONFIRM WINNER'}
                    </button>
                    <button 
                      onClick={() => confirmResult(false)} 
                      disabled={confirming}
                      className="btn-action btn-dispute"
                    >
                      {confirming ? 'PROCESSING...' : 'CONTEST RESULT'}
                    </button>
                </div>
                </div>
              )}

              {match.status === 'completed' && (
                <div className="action-card completed">
                  <div className="action-icon">🏆</div>
                  <div className="action-content">
                    <h3>MATCH COMPLETED</h3>
                    <div className="winner-display">
                      <span>WINNER: </span>
                      <span className="highlight">{match.winner_username}</span>
                    </div>
                    <div className="prize-display">
                      <span>PRIZE: </span>
                      <span className="highlight">{currencyDisplay.prize_pool}</span>
                    </div>
                    {match.completed_at && (
                      <div className="completed-time">
                        Ended: {new Date(match.completed_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {match.status === 'disputed' && (
                <div className="action-card disputed">
                  <div className="action-icon">⚖️</div>
                  <div className="action-content">
                    <h3>MATCH DISPUTED</h3>
                    <p>This match is under admin review</p>
                    {match.disputes && match.disputes.length > 0 && (
                      <div className="dispute-info">
                        <p>Reason: {match.disputes[0].reason || 'No reason provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {canCancel && (
                <div className="action-card manage">
                  <div className="action-icon">⚙️</div>
                  <div className="action-content">
                    <h3>MANAGE MATCH</h3>
                    <p>You created this match</p>
                    <p className="cancel-note">
                      Cancelling will remove this match. No deductions have been made yet.
                    </p>
                  </div>
                  <button onClick={cancelMatch} className="btn-action btn-cancel">
                    CANCEL MATCH
                  </button>
                </div>
              )}

              <div className="action-card info">
                <div className="action-icon">📋</div>
                <div className="action-content">
                  <h3>MATCH INFO</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <span>CURRENCY:</span>
                      <span className={match.stake_currency === 'xp' ? 'xp-currency' : 'money-currency'}>
                        {match.stake_currency === 'xp' ? 'XP POINTS' : 'NAIRA (₦)'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span>TYPE:</span>
                      <span>{match.opponent_type === 'open' ? 'OPEN CHALLENGE' : 'PRIVATE INVITE'}</span>
                    </div>
                    <div className="info-item">
                      <span>PRIZE OPTION:</span>
                      <span>{match.prize_pool_option === 'entry_fee' ? 'ENTRY FEE (85%)' : 'CUSTOM PRIZE'}</span>
                    </div>
                    {match.scheduled_at && (
                      <div className="info-item">
                        <span>SCHEDULED:</span>
                        <span>{new Date(match.scheduled_at).toLocaleString()}</span>
                      </div>
                    )}
                    {match.started_at && (
                      <div className="info-item">
                        <span>STARTED:</span>
                        <span>{new Date(match.started_at).toLocaleString()}</span>
                      </div>
                    )}
                    {match.completed_at && (
                      <div className="info-item">
                        <span>ENDED:</span>
                        <span>{new Date(match.completed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`match-chat-section ${isChatOpen ? 'open' : 'closed'}`}>
          <div className="chat-header">
            <div className="chat-title">
              <span className="chat-icon">💬</span>
              <h3>MATCH CHAT</h3>
              <span className="chat-badge">
                {chatMessages.filter(m => !m.is_system).length} messages
              </span>
              {!isSocketConnected && (
                <span className="chat-status-offline">(Offline)</span>
              )}
            </div>
            <button 
              className="chat-toggle"
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              {isChatOpen ? '−' : '+'}
            </button>
          </div>

          {isChatOpen && (
            <>
              <div className="chat-messages" ref={chatContainerRef}>
                {chatLoading ? (
                  <div className="chat-loading">
                    <div className="spinner-small"></div>
                    <p>Loading messages...</p>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="chat-empty">
                    <div className="empty-icon">💬</div>
                    <h4>No messages yet</h4>
                    <p>Be the first to send a message!</p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                )}
                
                {otherUserTyping && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="typing-text">Opponent is typing...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  disabled={sendingMessage || match.status === 'completed' || match.status === 'cancelled'}
                  maxLength={500}
                  className="chat-input"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage || match.status === 'completed' || match.status === 'cancelled'}
                  className="chat-send-btn"
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </form>

              <div className="chat-info">
                <p>
                  {match.status === 'completed' || match.status === 'cancelled'
                    ? 'Chat is locked - match has ended'
                    : 'Chat with your opponent and discuss the match'}
                </p>
                {!isSocketConnected && (
                  <p className="chat-warning">
                    ⚠️ Real-time chat is offline. Messages will be saved but may not appear instantly.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;