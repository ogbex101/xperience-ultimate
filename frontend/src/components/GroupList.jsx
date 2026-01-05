import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GroupList.css';

const GroupList = ({ groups = [], onRefresh }) => {
  const [groupMembers, setGroupMembers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroupMembers = async () => {
      const membersMap = {};
      
      // Use Promise.all for parallel requests
      const promises = groups.map(async (group) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/groups/${group.id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            membersMap[group.id] = {
              members: data.members || [],
              count: data.count || 0,
              adminCount: data.members?.filter(m => m.role === 'admin').length || 0
            };
          } else {
            // If member endpoint fails, use the count from group data
            membersMap[group.id] = {
              members: [],
              count: group.member_count || 0,
              adminCount: 0
            };
          }
        } catch (error) {
          console.error(`Error fetching members for group ${group.id}:`, error);
          // Fallback to group data
          membersMap[group.id] = {
            members: [],
            count: group.member_count || 0,
            adminCount: 0
          };
        }
      });
      
      await Promise.all(promises);
      setGroupMembers(membersMap);
    };
    
    if (groups.length > 0) {
      fetchGroupMembers();
    }
  }, [groups]);

  const handleOpenChat = (groupId) => {
    navigate(`/chat?group=${groupId}`);
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const getMemberCount = (groupId) => {
    return groupMembers[groupId]?.count || 0;
  };

  const getAdminCount = (groupId) => {
    return groupMembers[groupId]?.adminCount || 0;
  };

  return (
    <div className="group-list">
      <div className="group-list-header">
        <h3>Your Groups</h3>
        <button onClick={onRefresh} className="refresh-btn">
          <span className="refresh-icon">↻</span> Refresh
        </button>
      </div>
      
      {groups.length === 0 ? (
        <div className="no-groups-message">
          <p>You haven't joined any groups yet.</p>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group, index) => (
            <div 
              key={group.id} 
              className="group-card animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="group-card-header">
                <div className="header-main">
                  <h4 
                    onClick={() => handleViewGroup(group.id)} 
                    className="group-title-link"
                  >
                    {group.name}
                    <span className={`group-role ${group.role}`}>
                      {group.role === 'admin' ? ' 👑 Admin' : ' 👤 Member'}
                    </span>
                  </h4>
                  <div className="group-badges">
                    {group.tournament_wins > 0 && (
                      <span className="badge win-badge">
                        🏆 {group.tournament_wins} Wins
                      </span>
                    )}
                    {group.tournament_participations > 0 && (
                      <span className="badge tournament-badge">
                        ⚔️ {group.tournament_participations} Tours
                      </span>
                    )}
                  </div>
                </div>
                <span className="game-tag">{group.game_specialty}</span>
              </div>
              
              <p className="group-description">
                {group.description || 'No description available'}
              </p>
              
              <div className="group-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Members:</span>
                  <span className="stat-value">
                    👥 {getMemberCount(group.id)}/{group.max_members || 20}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Admins:</span>
                  <span className="stat-value">👑 {getAdminCount(group.id)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Tournaments:</span>
                  <span className="stat-value">⚔️ {group.tournament_count || 0}</span>
                </div>
              </div>
              
              <div className="group-card-actions">
                <button 
                  className="view-btn"
                  onClick={() => handleViewGroup(group.id)}
                >
                  View Details
                </button>
                <button 
                  className="chat-btn"
                  onClick={() => handleOpenChat(group.id)}
                >
                  Open Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupList;