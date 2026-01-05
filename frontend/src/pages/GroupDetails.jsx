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

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  const loadGroupDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGroup(data.group);
        setMembers(data.members);
        
        // Find current user's role
        const currentUser = data.members.find(
          member => member.user_id === parseInt(localStorage.getItem('userId'))
        );
        setUserRole(currentUser?.role || null);
      }
    } catch (error) {
      console.error('Error loading group details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteUsername.trim()) return;
    
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
      if (data.success) {
        loadGroupDetails(); // Refresh
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

  if (isLoading) {
    return <div className="loading">Loading group details...</div>;
  }

  if (!group) {
    return <div className="error">Group not found</div>;
  }

  return (
    <div className="group-details-page">
      <div className="group-details-container">
        {/* Group Header */}
        <div className="group-header">
          <button className="back-btn" onClick={() => navigate('/groups')}>
            ← Back to Groups
          </button>
          
          <div className="group-info">
            <h1>{group.name}</h1>
            <div className="group-meta">
              <span className="game-tag">{group.game_specialty}</span>
              <span className="member-count">
                {members.length} / {group.max_members} members
              </span>
              <span className="created-by">
                Created by: {members.find(m => m.role === 'admin')?.username || 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="group-actions">
            {userRole === 'admin' && (
              <button 
                className="invite-btn"
                onClick={() => setShowInviteModal(true)}
              >
                + Invite Members
              </button>
            )}
            <button 
              className="chat-btn"
              onClick={() => navigate(`/chat?group=${groupId}`)}
            >
              Open Group Chat
            </button>
            <button 
              className="leave-btn"
              onClick={handleLeaveGroup}
            >
              Leave Group
            </button>
          </div>
        </div>

        {/* Group Description */}
        <div className="group-description-section">
          <h3>Description</h3>
          <p>{group.description || 'No description provided'}</p>
        </div>

        {/* Members List */}
        <div className="members-section">
          <div className="section-header">
            <h3>Members ({members.length})</h3>
            <span>Your role: <strong className={`role-${userRole}`}>{userRole || 'Not a member'}</strong></span>
          </div>
          
          <div className="members-list">
            {members.map(member => (
              <div key={member.user_id} className="member-card">
                <div className="member-info">
                  <div className="member-avatar">
                    <img 
                      src={member.profile_pic || '/default-avatar.png'} 
                      alt={member.username}
                    />
                  </div>
                  <div className="member-details">
                    <h4>{member.username}</h4>
                    <div className="member-meta">
                      <span className={`member-role ${member.role}`}>
                        {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
                      </span>
                      <span className="member-rank">Rank: {member.rank || 'E'}</span>
                    </div>
                  </div>
                </div>
                
                {userRole === 'admin' && member.role !== 'admin' && (
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveMember(member.user_id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
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
              />
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