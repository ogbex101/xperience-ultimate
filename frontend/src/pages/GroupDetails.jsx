import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GroupDetails.css';

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [error, setError] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);

  // Check access before loading details
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`/api/groups/${groupId}/check-access`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 403) {
          navigate('/unauthorized');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Access check failed');
        }
        
        setAccessChecked(true);
      } catch (error) {
        console.error('Access check error:', error);
        navigate('/unauthorized');
      }
    };
    
    if (groupId) {
      checkAccess();
    }
  }, [groupId, navigate]);

  // Load group details after access is verified
  useEffect(() => {
    if (accessChecked) {
      loadGroupDetails();
    }
  }, [accessChecked, groupId]);

  const loadGroupDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Handle different error statuses
      if (response.status === 403) {
        setError('You do not have permission to view this group');
        setIsLoading(false);
        return;
      }
      
      if (response.status === 404) {
        setError('Group not found');
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGroup(data.group);
        setMembers(data.members || []);
        setUserRole(data.userRole || null);
      } else {
        setError(data.message || 'Failed to load group details');
      }
    } catch (error) {
      console.error('Error loading group details:', error);
      setError('Failed to load group details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteUsername.trim()) {
      alert('Please enter a username');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: inviteUsername })
      });
      
      const data = await response.json();
      
      if (response.status === 403) {
        alert('You do not have permission to invite users');
        return;
      }
      
      if (data.success) {
        setShowInviteModal(false);
        setInviteUsername('');
        alert('Invitation sent successfully!');
      } else {
        alert(data.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Error sending invitation');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.status === 403) {
        alert('You do not have permission to remove members');
        return;
      }
      
      if (data.success) {
        // Update local state instead of reloading everything
        setMembers(members.filter(member => member.user_id !== userId));
        alert('Member removed successfully');
      } else {
        alert(data.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error removing member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Successfully left the group');
        navigate('/groups');
      } else {
        alert(data.message || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Error leaving group');
    }
  };

  const handleUpdateSettings = async () => {
    // This would open a settings modal
    alert('Settings update feature coming soon');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading group details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="back-btn" onClick={() => navigate('/groups')}>
          Back to Groups
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="error-container">
        <h2>Group Not Found</h2>
        <p>The group you're looking for doesn't exist or has been removed.</p>
        <button className="back-btn" onClick={() => navigate('/groups')}>
          Back to Groups
        </button>
      </div>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const isMember = userRole !== null && userRole !== 'none';

  return (
    <div className="group-details-page">
      <div className="group-details-container">
        {/* Group Header */}
        <div className="group-header">
          <button className="back-btn" onClick={() => navigate('/groups')}>
            ← Back to Groups
          </button>
          
          <div className="group-info">
            <div className="group-title-row">
              <h1>{group.name}</h1>
              {isAdmin && (
                <span className="admin-badge">
                  {userRole === 'owner' ? '👑 Owner' : '⭐ Admin'}
                </span>
              )}
            </div>
            <div className="group-meta">
              <span className="game-tag">{group.game_specialty}</span>
              <span className="member-count">
                {members.length} / {group.max_members} members
              </span>
              <span className="visibility-tag">
                {group.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
              </span>
              <span className="created-by">
                Created by: {members.find(m => m.role === 'admin')?.username || 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="group-actions">
            {isAdmin && (
              <>
                <button 
                  className="settings-btn"
                  onClick={handleUpdateSettings}
                >
                  ⚙️ Settings
                </button>
                <button 
                  className="invite-btn"
                  onClick={() => setShowInviteModal(true)}
                >
                  + Invite Members
                </button>
              </>
            )}
            
            <button 
              className="chat-btn"
              onClick={() => navigate(`/chat?group=${groupId}`)}
              disabled={!isMember}
              title={!isMember ? "Join group to access chat" : "Open group chat"}
            >
              💬 Group Chat
            </button>
            
            {isMember ? (
              <button 
                className="leave-btn danger"
                onClick={handleLeaveGroup}
              >
                🚪 Leave Group
              </button>
            ) : group.visibility === 'public' ? (
              <button 
                className="join-btn"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/groups/${groupId}/request`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                      alert('Join request sent! Waiting for admin approval.');
                      loadGroupDetails(); // Refresh to show pending status
                    } else {
                      alert(data.message || 'Failed to send join request');
                    }
                  } catch (error) {
                    console.error('Error requesting to join:', error);
                    alert('Error sending join request');
                  }
                }}
              >
                ✋ Request to Join
              </button>
            ) : (
              <button 
                className="join-btn disabled"
                disabled
                title="Private group - invitation required"
              >
                🔒 Private Group
              </button>
            )}
          </div>
        </div>

        {/* Group Description */}
        <div className="group-description-section">
          <h3>Description</h3>
          <p>{group.description || 'No description provided'}</p>
          
          <div className="group-stats">
            <div className="stat-card">
              <span className="stat-label">Tournaments Participated</span>
              <span className="stat-value">{group.tournament_participations || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tournaments Won</span>
              <span className="stat-value">{group.tournament_wins || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value">
                {group.tournament_participations > 0 
                  ? `${Math.round((group.tournament_wins / group.tournament_participations) * 100)}%` 
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="members-section">
          <div className="section-header">
            <h3>Members ({members.length})</h3>
            <div className="role-indicator">
              Your role: <strong className={`role-${userRole}`}>
                {userRole === 'owner' ? '👑 Owner' : 
                 userRole === 'admin' ? '⭐ Admin' : 
                 userRole === 'member' ? '👤 Member' : 
                 '👁️ Viewer'}
              </strong>
            </div>
          </div>
          
          {members.length === 0 ? (
            <div className="no-members">
              <p>No members in this group yet.</p>
              {isAdmin && (
                <button 
                  className="invite-btn"
                  onClick={() => setShowInviteModal(true)}
                >
                  + Invite First Member
                </button>
              )}
            </div>
          ) : (
            <div className="members-list">
              {members.map(member => (
                <div key={member.user_id} className="member-card">
                  <div className="member-info">
                    <div className="member-avatar">
                      <img 
                        src={member.profile_pic || '/default-avatar.png'} 
                        alt={member.username}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                    </div>
                    <div className="member-details">
                      <div className="member-name-row">
                        <h4>{member.username}</h4>
                        {member.user_id === group.creator_id && (
                          <span className="creator-badge">👑 Creator</span>
                        )}
                      </div>
                      <div className="member-meta">
                        <span className={`member-role ${member.role}`}>
                          {member.role === 'admin' ? '⭐ Admin' : '👤 Member'}
                        </span>
                        <span className="member-rank">
                          Rank: {member.rank || 'Unranked'}
                        </span>
                        {member.user_id === parseInt(localStorage.getItem('userId')) && (
                          <span className="you-badge">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && member.role !== 'admin' && member.user_id !== req.user.id && (
                    <button 
                      className="remove-btn danger"
                      onClick={() => handleRemoveMember(member.user_id)}
                      title="Remove member from group"
                    >
                      Remove
                    </button>
                  )}
                  
                  {isAdmin && member.role === 'admin' && member.user_id !== group.creator_id && userRole === 'owner' && (
                    <button 
                      className="remove-btn danger"
                      onClick={() => handleRemoveMember(member.user_id)}
                      title="Remove admin (owner only)"
                    >
                      Remove Admin
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Only Section */}
        {isAdmin && (
          <div className="admin-section">
            <h3>Admin Controls</h3>
            <div className="admin-controls">
              <button 
                className="admin-btn"
                onClick={() => setShowInviteModal(true)}
              >
                📨 Invite Members
              </button>
              <button 
                className="admin-btn"
                onClick={handleUpdateSettings}
              >
                ⚙️ Group Settings
              </button>
              <button 
                className="admin-btn danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                    // Implement group deletion
                    alert('Group deletion feature coming soon');
                  }
                }}
              >
                🗑️ Delete Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite to Group</h3>
              <button 
                className="close-btn"
                onClick={() => setShowInviteModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Enter username to invite:</p>
              <input
                type="text"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="Enter username"
                className="invite-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleInviteUser();
                  }
                }}
              />
              <p className="modal-hint">
                User will receive an invitation to join this group.
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="invite-submit-btn"
                onClick={handleInviteUser}
                disabled={!inviteUsername.trim()}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;
