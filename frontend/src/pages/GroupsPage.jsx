import React, { useState, useEffect } from 'react';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupList from '../components/GroupList';
import './GroupsPage.css';

const GroupsPage = () => {
    const [myGroups, setMyGroups] = useState([]);
    const [popularGroups, setPopularGroups] = useState([]);
    const [discoverGroups, setDiscoverGroups] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState({
        myGroups: true,
        popular: true,
        discover: true
    });
    const [activeTab, setActiveTab] = useState('my-groups');

    useEffect(() => {
        loadAllGroups();
    }, []);

    const loadAllGroups = async () => {
        try {
            setIsLoading({ myGroups: true, popular: true, discover: true });
            await Promise.all([
                loadUserGroups(),
                loadPopularGroups(),
                loadDiscoverGroups()
            ]);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    const loadUserGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/groups/my-groups', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMyGroups(data.groups);
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
        } finally {
            setIsLoading(prev => ({ ...prev, myGroups: false }));
        }
    };

    const loadPopularGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/groups/popular', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setPopularGroups(data.groups);
            }
        } catch (error) {
            console.error('Error loading popular groups:', error);
        } finally {
            setIsLoading(prev => ({ ...prev, popular: false }));
        }
    };

    const loadDiscoverGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/groups/discover', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setDiscoverGroups(data.groups);
            }
        } catch (error) {
            console.error('Error loading discover groups:', error);
        } finally {
            setIsLoading(prev => ({ ...prev, discover: false }));
        }
    };

    const handleCreateGroup = async (groupData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/groups/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupData)
            });
            const data = await response.json();
            if (data.success) {
                setShowCreateModal(false);
                loadAllGroups(); // Refresh all groups
            }
            return data;
        } catch (error) {
            console.error('Error creating group:', error);
            return { success: false, message: 'Error creating group' };
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        try {
            setIsLoading({ myGroups: true, popular: true, discover: true });
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/groups/search?query=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMyGroups(data.groups);
                setActiveTab('my-groups');
            }
        } catch (error) {
            console.error('Error searching groups:', error);
        } finally {
            setIsLoading({ myGroups: false, popular: false, discover: false });
        }
    };

    const handleJoinRequest = async (groupId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/groups/${groupId}/request`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                alert(data.message);
                loadDiscoverGroups(); // Refresh discover groups
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error requesting to join:', error);
            alert('Error sending join request');
        }
    };

    const renderLoadingSkeleton = (count = 3) => (
        <div className="skeleton-grid">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="group-card shimmer">
                    <div className="skeleton-header"></div>
                    <div className="skeleton-description"></div>
                    <div className="skeleton-stats"></div>
                    <div className="skeleton-actions"></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="groups-page">
            {/* Header Section */}
            <div className="groups-header animate-fade-in">
                <div className="header-content">
                    <h1 className="gradient-text">
                        <span className="icon">👥</span> Gaming Groups
                    </h1>
                    <p className="header-subtitle">
                        Join forces, compete together, and dominate tournaments
                    </p>
                </div>
                
                <div className="header-actions">
                    <div className="search-container animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="search-wrapper">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search groups by name or game..."
                                className="search-input"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button onClick={handleSearch} className="search-button">
                                <span className="search-icon">🔍</span>
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="create-group-button animate-pulse-glow"
                    >
                        <span className="button-icon">+</span>
                        Create New Group
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="groups-tabs animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <button 
                    className={`tab-button ${activeTab === 'my-groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my-groups')}
                >
                    <span className="tab-icon">🏠</span>
                    My Groups
                    {myGroups.length > 0 && (
                        <span className="tab-badge">{myGroups.length}</span>
                    )}
                </button>
                
                <button 
                    className={`tab-button ${activeTab === 'popular' ? 'active' : ''}`}
                    onClick={() => setActiveTab('popular')}
                >
                    <span className="tab-icon">🔥</span>
                    Popular Groups
                    {popularGroups.length > 0 && (
                        <span className="tab-badge popular-badge">
                            {popularGroups.length}
                        </span>
                    )}
                </button>
                
                <button 
                    className={`tab-button ${activeTab === 'discover' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discover')}
                >
                    <span className="tab-icon">🌐</span>
                    Discover Groups
                    {discoverGroups.length > 0 && (
                        <span className="tab-badge discover-badge">
                            {discoverGroups.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Main Content */}
            <div className="groups-content animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {/* My Groups Tab */}
                {activeTab === 'my-groups' && (
                    <div className="tab-content">
                        <div className="section-header">
                            <h2>
                                <span className="section-icon">🏠</span>
                                My Gaming Groups
                                <span className="section-count">{myGroups.length}</span>
                            </h2>
                            <button 
                                onClick={loadUserGroups}
                                className="refresh-button"
                                disabled={isLoading.myGroups}
                            >
                                {isLoading.myGroups ? '🔄' : '↻'} Refresh
                            </button>
                        </div>
                        
                        {isLoading.myGroups ? (
                            renderLoadingSkeleton(3)
                        ) : myGroups.length === 0 ? (
                            <div className="empty-state animate-float">
                                <div className="empty-icon">👥</div>
                                <h3>No Groups Yet</h3>
                                <p>You haven't joined any groups. Create your own or join existing ones!</p>
                                <button 
                                    onClick={() => setShowCreateModal(true)}
                                    className="create-first-group"
                                >
                                    Create Your First Group
                                </button>
                            </div>
                        ) : (
                            <GroupList groups={myGroups} onRefresh={loadUserGroups} />
                        )}
                    </div>
                )}

                {/* Popular Groups Tab */}
                {activeTab === 'popular' && (
                    <div className="tab-content">
                        <div className="section-header">
                            <h2>
                                <span className="section-icon">🔥</span>
                                Popular Groups
                                <span className="section-badge popular-badge">TRENDING</span>
                            </h2>
                            <p className="section-subtitle">
                                Top groups based on tournament wins and activity
                            </p>
                        </div>
                        
                        {isLoading.popular ? (
                            renderLoadingSkeleton(4)
                        ) : popularGroups.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🏆</div>
                                <h3>No Popular Groups</h3>
                                <p>Be the first to create a trending group!</p>
                            </div>
                        ) : (
                            <div className="popular-groups-grid">
                                {popularGroups.map((group, index) => (
                                    <div 
                                        key={group.id} 
                                        className="group-card animate-fade-in"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="group-card-header">
                                            <div className="group-badges">
                                                {group.tournament_wins > 0 && (
                                                    <span className="badge win-badge">
                                                        🏆 {group.tournament_wins} Wins
                                                    </span>
                                                )}
                                                {group.tournament_participations > 0 && (
                                                    <span className="badge participation-badge">
                                                        ⚔️ {group.tournament_participations} Tours
                                                    </span>
                                                )}
                                                {index < 3 && (
                                                    <span className="badge rank-badge">
                                                        #{index + 1} Top Group
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <h3 className="group-title">
                                                {group.name}
                                                {group.is_member && (
                                                    <span className="member-indicator">✓ Member</span>
                                                )}
                                            </h3>
                                            
                                            <span className="game-tag">
                                                {group.game_specialty}
                                            </span>
                                        </div>
                                        
                                        <div className="group-stats">
                                            <div className="stat">
                                                <span className="stat-label">Members</span>
                                                <span className="stat-value">
                                                    👥 {group.member_count}/{group.max_members || 20}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Tournaments</span>
                                                <span className="stat-value">
                                                    ⚔️ {group.tournament_participations || 0}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Wins</span>
                                                <span className="stat-value win-value">
                                                    🏆 {group.tournament_wins || 0}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="group-description">
                                            {group.description || 'No description available'}
                                        </p>
                                        
                                        <div className="group-card-actions">
                                            {group.is_member ? (
                                                <button 
                                                    className="view-btn"
                                                    onClick={() => window.location.href = `/groups/${group.id}`}
                                                >
                                                    View Group
                                                </button>
                                            ) : (
                                                <button 
                                                    className="join-btn"
                                                    onClick={() => handleJoinRequest(group.id)}
                                                >
                                                    Request to Join
                                                </button>
                                            )}
                                            <button 
                                                className="details-btn"
                                                onClick={() => window.location.href = `/groups/${group.id}`}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Discover Groups Tab */}
                {activeTab === 'discover' && (
                    <div className="tab-content">
                        <div className="section-header">
                            <h2>
                                <span className="section-icon">🌐</span>
                                Discover Groups
                                <span className="section-count">{discoverGroups.length}</span>
                            </h2>
                            <p className="section-subtitle">
                                Public groups you can join to compete together
                            </p>
                        </div>
                        
                        {isLoading.discover ? (
                            renderLoadingSkeleton(4)
                        ) : discoverGroups.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🔍</div>
                                <h3>No Groups Available</h3>
                                <p>You've joined all available groups or there are no public groups yet.</p>
                                <button 
                                    onClick={() => setShowCreateModal(true)}
                                    className="create-first-group"
                                >
                                    Create a New Group
                                </button>
                            </div>
                        ) : (
                            <div className="discover-groups-grid">
                                {discoverGroups.map((group, index) => (
                                    <div 
                                        key={group.id} 
                                        className="group-card animate-fade-in"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="group-card-header">
                                            <div className="visibility-badge">
                                                {group.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                                            </div>
                                            
                                            <h3 className="group-title">{group.name}</h3>
                                            <span className="game-tag">
                                                {group.game_specialty}
                                            </span>
                                        </div>
                                        
                                        <div className="group-creator">
                                            <span className="creator-label">Created by:</span>
                                            <span className="creator-name">{group.creator_name}</span>
                                        </div>
                                        
                                        <p className="group-description">
                                            {group.description || 'No description available'}
                                        </p>
                                        
                                        <div className="group-stats">
                                            <div className="stat">
                                                <span className="stat-label">Members</span>
                                                <span className="stat-value">
                                                    👥 {group.member_count}/{group.max_members || 20}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Tournaments</span>
                                                <span className="stat-value">
                                                    ⚔️ {group.tournament_participations || 0}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Wins</span>
                                                <span className="stat-value">
                                                    🏆 {group.tournament_wins || 0}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="group-card-actions">
                                            <button 
                                                className="join-btn primary"
                                                onClick={() => handleJoinRequest(group.id)}
                                            >
                                                Request to Join
                                            </button>
                                            <button 
                                                className="details-btn"
                                                onClick={() => window.location.href = `/groups/${group.id}`}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateGroup}
                />
            )}
        </div>
    );
};

export default GroupsPage;