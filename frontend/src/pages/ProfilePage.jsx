import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader, User, Trophy, BarChart, Award, Gamepad2, Target, Shield, Star, Crown, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../utils/api';
import UserInfo from '../components/profile/UserInfo';
import RankProgress from '../components/profile/RankProgress';
import UserTitles from '../components/profile/UserTitles';
import UserStats from '../components/profile/UserStats';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [rankProgress, setRankProgress] = useState(null);
  const [titles, setTitles] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const isOwnProfile = currentUser && id === currentUser.id.toString();
  const isAdmin = currentUser?.is_admin;

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is trying to access someone else's profile
      if (!isOwnProfile && !isAdmin) {
        // Log unauthorized access attempt
        console.warn(`Unauthorized profile access attempt: User ${currentUser?.id} trying to access profile ${id}`);
        
        // Option 1: Redirect to own profile
        navigate(`/profile/${currentUser?.id}`);
        return;
        
        // Option 2: Show limited profile (public info only)
        // We'll implement this below
      }

      // Fetch user profile with proper authorization
      const profileResponse = await usersAPI.getProfile(id);
      
      if (!profileResponse.success) {
        throw new Error(profileResponse.error || 'Failed to load profile');
      }

      setProfileData(profileResponse.data);

      // Fetch rank progress (public info, okay for others to see)
      const rankResponse = await usersAPI.getRankProgress(id);
      if (rankResponse.success) {
        setRankProgress(rankResponse.data);
      }

      // Fetch user titles (public info)
      const titlesResponse = await usersAPI.getUserTitles(id);
      if (titlesResponse.success) {
        setTitles(titlesResponse.data);
      }

    } catch (err) {
      console.error('Error fetching profile:', err);
      
      if (err.response?.status === 403) {
        // Server denied access (unauthorized)
        setError('You do not have permission to view this profile');
        setTimeout(() => {
          navigate(`/profile/${currentUser?.id}`);
        }, 2000);
      } else {
        setError(err.message || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to sanitize profile data for public viewing
  const getPublicProfileData = () => {
    if (!profileData) return null;
    
    if (isOwnProfile || isAdmin) {
      // Show all data for own profile or admins
      return profileData;
    }
    
    // Public view - only show non-sensitive data
    return {
      ...profileData,
      // Hide sensitive information
      email: 'hidden@example.com',
      phone: '*******',
      wallet_account_number: '*******',
      account_status: 'hidden',
      is_admin: false,
      admin_role: null,
      created_at: profileData.created_at, // Keep for "Member Since"
      // Show other public info
      username: profileData.username,
      profile_pic: profileData.profile_pic,
      rank: profileData.rank,
      wins: profileData.wins,
      matches_played: profileData.matches_played,
      win_rate: profileData.win_rate,
      tournaments_won: profileData.tournaments_won,
      xp_points: profileData.xp_points,
      stats: profileData.stats
    };
  };

  const handleTitleEquipped = (equippedTitle) => {
    // Only allow if own profile
    if (!isOwnProfile) return;
    
    setProfileData(prev => ({
      ...prev,
      equipped_title: equippedTitle
    }));
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 'SSS': return Crown;
      case 'SS': return Star;
      case 'S': return Trophy;
      case 'A': return Award;
      case 'B': return Shield;
      case 'C': return Target;
      case 'D': return Shield;
      default: return Target;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
            <Lock className="text-red-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/profile/${currentUser?.id}`)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Go to Your Profile
          </button>
        </div>
      </div>
    );
  }

  const displayData = getPublicProfileData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
               {/* Back Button and Viewing Notice */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          
          {/* Viewing Notice - Only shows when viewing someone else's profile */}
          {!isOwnProfile && (
            <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/20 px-3 py-1 rounded-lg">
              <EyeOff size={16} />
              <span>Viewing Public Profile - Some information is hidden</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Info */}
            <UserInfo 
              user={displayData}
              isOwnProfile={isOwnProfile}
              onUpdate={isOwnProfile ? setProfileData : null}
              isPublicView={!isOwnProfile}
            />

            {/* Tabs for Titles and Stats */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex border-b border-gray-800">
                <button
                  onClick={() => setActiveTab('titles')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'titles'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Award size={18} />
                    Titles ({titles?.total || 0})
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'stats'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <BarChart size={18} />
                    Stats
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'titles' && titles && (
                  <UserTitles
                    titles={titles}
                    userId={id}
                    isOwnProfile={isOwnProfile}
                    onTitleEquipped={handleTitleEquipped}
                  />
                )}
                
                {activeTab === 'stats' && displayData.stats && (
                  <UserStats 
                    stats={displayData.stats} 
                    isPublicView={!isOwnProfile}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                {isOwnProfile ? 'Your Info' : 'Profile Info'}
                {!isOwnProfile && <Eye size={16} className="text-gray-400" />}
              </h3>
              
              <div className="space-y-4">
                {/* Wallet Account - Hide for others */}
                {isOwnProfile ? (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Wallet Account</span>
                    <span className="font-mono text-white">
                      {displayData.wallet_account_number}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Wallet Account</span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Lock size={12} />
                      Private
                    </span>
                  </div>
                )}
                
                {/* Account Status - Hide for others */}
                {isOwnProfile || isAdmin ? (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Account Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      displayData.account_status === 'active'
                        ? 'bg-green-900/30 text-green-300'
                        : displayData.account_status === 'suspended'
                        ? 'bg-red-900/30 text-red-300'
                        : 'bg-yellow-900/30 text-yellow-300'
                    }`}>
                      {displayData.account_status.toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Account Status</span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Lock size={12} />
                      Private
                    </span>
                  </div>
                )}
                
                {/* Member Since - Public info */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white">
                    {new Date(displayData.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                
                {/* Admin Role - Only show to admins or own profile */}
                {(isOwnProfile || isAdmin) && displayData.is_admin && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Admin Role</span>
                    <span className="text-purple-400 font-semibold">
                      {displayData.admin_role || 'Admin'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Rank Progress Section - Public info */}
            {rankProgress && (
              <RankProgress 
                rankProgress={rankProgress} 
                isOwnProfile={isOwnProfile}
              />
            )}

            {/* Quick Actions (only for own profile) */}
            {isOwnProfile ? (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Link
                    to="/matches/create"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-white">Create Match</div>
                      <div className="text-sm text-gray-400">Start a new match</div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/tournaments/create"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Award size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-white">Create Tournament</div>
                      <div className="text-sm text-gray-400">Host a tournament</div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/wallet"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                      <BarChart size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-white">Manage Wallet</div>
                      <div className="text-sm text-gray-400">View transactions</div>
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
              // Show message for viewing others' profiles
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                    <Eye size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Viewing Public Profile</h3>
                    <p className="text-sm text-gray-400">Some information is private</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>Rank and stats are visible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>Earned titles are visible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span>Private information is hidden</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;