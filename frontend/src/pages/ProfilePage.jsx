import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader, 
  User, 
  Trophy, 
  BarChart, 
  Award, 
  Gamepad2, 
  Target, 
  Shield, 
  Star, 
  Crown, 
  Lock, 
  Eye, 
  EyeOff, 
  Users, 
  Zap, 
  Coins, 
  Calendar, 
  Mail,
  TrendingUp,
  Edit,
  Save,
  X,
  Check,
  Activity,
  CheckCircle,
  XCircle,
  Swords,
  DollarSign,
  Users as UsersIcon,
  Target as TargetIcon,
  Sword,
  Hash,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../utils/api';

// Rank requirements from your SQL - FINAL CORRECT
const RANK_REQUIREMENTS = {
  'E': { name: 'Newbie', min_wins: 0, min_matches: 0, win_rate: 0, color: '#ffffff', next: 'D' },
  'D': { name: 'Bronze', min_wins: 10, min_matches: 25, win_rate: 50, color: '#1e90ff', next: 'C' },
  'C': { name: 'Silver', min_wins: 20, min_matches: 50, win_rate: 55, color: '#00ff00', next: 'B' },
  'B': { name: 'Gold', min_wins: 50, min_matches: 100, win_rate: 60, color: '#ffff00', next: 'A' },
  'A': { name: 'Platinum', min_wins: 100, min_matches: 200, win_rate: 65, color: '#ff8c00', next: 'S' },
  'S': { name: 'Diamond', min_wins: 200, min_matches: 400, win_rate: 70, color: '#ff0000', next: 'SS' },
  'SS': { name: 'Elite', min_wins: 300, min_matches: 600, win_rate: 75, color: '#ff4500', next: 'SSS' },
  'SSS': { name: 'Supreme', min_wins: 500, min_matches: 1000, win_rate: 80, color: '#ff00ff', next: null }
};

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [rankProgress, setRankProgress] = useState(null);
  const [userTitles, setUserTitles] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [activeTab, setActiveTab] = useState('titles');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  
  const isOwnProfile = currentUser && id === currentUser.id.toString();
  const isAdmin = currentUser?.is_admin;

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isOwnProfile && !isAdmin) {
        navigate(`/profile/${currentUser?.id}`);
        return;
      }

      // Fetch user profile
      const profileResponse = await usersAPI.getProfile(id);
      
      let userData;
      if (profileResponse && profileResponse.user) {
        userData = profileResponse.user;
      } else if (profileResponse && profileResponse.data) {
        userData = profileResponse.data;
      } else {
        userData = profileResponse || {};
      }

      if (!userData || !userData.id) {
        throw new Error('Failed to load profile data');
      }

      setProfileData(userData);
      setEditedUser({
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        bio: userData.bio || ''
      });

      // Calculate rank progress with FINAL CORRECT LOGIC
      const progressData = calculateRankProgress(userData);
      setRankProgress(progressData);

      // Fetch user titles
      try {
        const titlesResponse = await usersAPI.getUserTitles(id);
        if (titlesResponse && titlesResponse.data) {
          setUserTitles(titlesResponse.data.all || []);
        }
      } catch (titlesError) {
        console.log('Titles fetch failed, using empty array:', titlesError);
        setUserTitles([]);
      }

      // User stats
      const statsData = {
        kd_ratio: '1.25',
        headshot_ratio: '42',
        mvp_awards: userData.tournaments_won || 0,
        current_streak: 3,
        tournaments_won: userData.tournaments_won || 0,
        win_rate: userData.win_rate || 0,
        highest_rank: 25,
        perfect_wins: 2,
        total_kills: 156,
        total_deaths: 124,
        tournaments_played: 12,
        undefeated_rounds: 5,
        wins: userData.wins || 0,
        matches_played: userData.matches_played || 0
      };
      setUserStats(statsData);

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // FINAL CORRECT LOGIC: Shows NEXT rank's TOTAL requirements
  const calculateRankProgress = (userData) => {
    const currentRank = userData.rank || 'E';
    const userWins = userData.wins || 0;
    const userMatches = userData.matches_played || 0;
    const userWinRate = userData.win_rate || 0;
    
    const currentRankInfo = RANK_REQUIREMENTS[currentRank];
    const nextRank = currentRankInfo.next;
    const nextRankInfo = nextRank ? RANK_REQUIREMENTS[nextRank] : null;
    
    if (!nextRankInfo) {
      // User is at highest rank (SSS)
      return {
        current_rank: currentRank,
        current_rank_name: currentRankInfo.name,
        current_rank_color: currentRankInfo.color,
        next_rank: null,
        next_rank_name: null,
        next_rank_color: null,
        overall_percentage: 100,
        can_rank_up: false,
        is_max_rank: true,
        message: 'You have reached the highest rank!'
      };
    }
    
    // Calculate progress using NEXT rank's TOTAL requirements
    const winsProgress = Math.min(100, (userWins / nextRankInfo.min_wins) * 100);
    const matchesProgress = Math.min(100, (userMatches / nextRankInfo.min_matches) * 100);
    const winRateProgress = Math.min(100, (userWinRate / nextRankInfo.win_rate) * 100);
    
    // Overall progress (average of all three)
    const overallProgress = Math.round((winsProgress + matchesProgress + winRateProgress) / 3);
    
    // Check if ready for next rank
    const canRankUp = (
      userWins >= nextRankInfo.min_wins &&
      userMatches >= nextRankInfo.min_matches &&
      userWinRate >= nextRankInfo.win_rate
    );
    
    return {
      current_rank: currentRank,
      current_rank_name: currentRankInfo.name,
      current_rank_color: currentRankInfo.color,
      next_rank: nextRank,
      next_rank_name: nextRankInfo.name,
      next_rank_color: nextRankInfo.color,
      overall_percentage: overallProgress,
      can_rank_up: canRankUp,
      is_max_rank: false,
      
      // Requirements for NEXT rank - TOTAL requirements from SQL
      next_requirements: {
        wins: {
          required: nextRankInfo.min_wins, // TOTAL wins needed for next rank
          current: userWins, // User's current wins
          needed: Math.max(0, nextRankInfo.min_wins - userWins), // Additional wins needed
          percentage: winsProgress,
          color: '#3B82F6'
        },
        matches: {
          required: nextRankInfo.min_matches, // TOTAL matches needed for next rank
          current: userMatches, // User's current matches
          needed: Math.max(0, nextRankInfo.min_matches - userMatches), // Additional matches needed
          percentage: matchesProgress,
          color: '#10B981'
        },
        win_rate: {
          required: nextRankInfo.win_rate, // Win rate for next rank
          current: userWinRate, // User's current win rate
          needed: Math.max(0, nextRankInfo.win_rate - userWinRate), // Additional win rate needed
          percentage: winRateProgress,
          color: '#8B5CF6'
        }
      }
    };
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 'SSS': return Crown;
      case 'SS': return Star;
      case 'S': return Trophy;
      case 'A': return Award;
      case 'B': return Shield;
      case 'C': return Target;
      case 'D': return UsersIcon;
      default: return User;
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await usersAPI.updateProfile(editedUser);
      if (response.success) {
        setProfileData(prev => ({ ...prev, ...editedUser }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const ProgressBar = ({ label, current, required, percentage, color, icon: Icon }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color }} />}
          <span className="text-sm text-gray-300">{label}</span>
        </div>
        <span className="text-sm font-semibold" style={{ color }}>
          {current}/{required}
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            background: color
          }}
        />
      </div>
      <div className="text-xs text-gray-400 text-right">
        {percentage.toFixed(1)}%
        {required - current > 0 && ` (Need ${required - current} more)`}
      </div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, color = 'text-white', description }) => (
    <div className="bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-gray-700/50">
          <Icon className="text-gray-300" size={20} />
        </div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
      {description && <div className="text-xs text-gray-500">{description}</div>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
            <Lock className="text-red-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Profile</h2>
          <p className="text-gray-400 mb-6">{error || 'Profile not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const displayData = profileData;
  const accountStatus = displayData.account_status || 'active';
  const accountStatusText = typeof accountStatus === 'string' 
    ? accountStatus.toUpperCase() 
    : 'ACTIVE';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={displayData.profile_pic || '/default-avatar.png'}
                alt={displayData.username}
                className="w-32 h-32 rounded-full border-4 border-purple-500 object-cover"
              />
              {displayData.equipped_title && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-purple-900/50 text-purple-300 border border-purple-700">
                  {displayData.equipped_title}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white">{displayData.username}</h1>
                  {!isEditing && displayData.firstname && displayData.lastname && (
                    <p className="text-gray-300 mt-1">
                      {displayData.firstname} {displayData.lastname}
                    </p>
                  )}
                </div>
                
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors mt-2 md:mt-0"
                  >
                    {isEditing ? (
                      <>
                        <X size={16} />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit size={16} />
                        Edit Profile
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Edit Form */}
              {isEditing && isOwnProfile && (
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">First Name</label>
                      <input
                        type="text"
                        value={editedUser.firstname}
                        onChange={(e) => setEditedUser({...editedUser, firstname: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={editedUser.lastname}
                        onChange={(e) => setEditedUser({...editedUser, lastname: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Bio</label>
                    <textarea
                      value={editedUser.bio}
                      onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      rows="3"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Matches</div>
                  <div className="text-2xl font-bold text-white">{displayData.matches_played || 0}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Win Rate</div>
                  <div className="text-2xl font-bold text-green-400">{displayData.win_rate || 0}%</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">XP Points</div>
                  <div className="text-2xl font-bold text-yellow-400">{displayData.xp_points || 0}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Balance</div>
                  <div className="text-2xl font-bold text-green-400">
                    ₦{(displayData.balance || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-gray-300 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <span>{displayData.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Joined {new Date(displayData.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {displayData.bio && !isEditing && (
                  <div className="bg-gray-800/30 rounded-lg p-4 mt-4">
                    <p className="text-gray-200">{displayData.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Rank Progress & Tabs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rank Progress - WIDE LAYOUT */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="text-yellow-400" size={24} />
                <h2 className="text-xl font-bold text-white">Rank Progress</h2>
              </div>

              {rankProgress && (
                <>
                  {/* Current and Next Rank Display */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-center">
                      <div 
                        className="text-5xl font-bold mb-2"
                        style={{ color: rankProgress.current_rank_color }}
                      >
                        {rankProgress.current_rank}
                      </div>
                      <div className="text-gray-400 text-sm">{rankProgress.current_rank_name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Current Rank
                      </div>
                    </div>
                    
                    <div className="flex-1 mx-8">
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>
                            Progress to {rankProgress.next_rank_name || 'Max Rank'}
                          </span>
                          <span className="font-bold text-white">{rankProgress.overall_percentage || 0}%</span>
                        </div>
                        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${rankProgress.overall_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center text-sm text-gray-400">
                        {rankProgress.next_rank 
                          ? `Requirements for ${rankProgress.next_rank_name} rank` 
                          : 'Highest Rank Achieved'}
                      </div>
                    </div>
                    
                    {rankProgress.next_rank ? (
                      <div className="text-center">
                        <div 
                          className="text-5xl font-bold mb-2"
                          style={{ color: rankProgress.next_rank_color }}
                        >
                          {rankProgress.next_rank}
                        </div>
                        <div className="text-gray-400 text-sm">{rankProgress.next_rank_name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Next Rank
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div 
                          className="text-5xl font-bold mb-2 text-yellow-400"
                        >
                          👑
                        </div>
                        <div className="text-gray-400 text-sm">Max Rank</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Supreme Supreme Supreme
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NEXT RANK Requirements - FINAL CORRECT LOGIC */}
                  {rankProgress.next_requirements && !rankProgress.is_max_rank && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Wins Required for NEXT rank */}
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            <Target className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Wins Needed</div>
                            <div className="text-lg font-bold text-white">
                              {rankProgress.next_requirements.wins.current}/{rankProgress.next_requirements.wins.required}
                            </div>
                            <div className="text-xs text-gray-500">
                              Total for {rankProgress.next_rank_name}
                            </div>
                          </div>
                        </div>
                        <ProgressBar
                          label=""
                          current={rankProgress.next_requirements.wins.current}
                          required={rankProgress.next_requirements.wins.required}
                          percentage={rankProgress.next_requirements.wins.percentage}
                          color={rankProgress.next_requirements.wins.color}
                          icon={Target}
                        />
                      </div>

                      {/* Matches Required for NEXT rank */}
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-green-500/20">
                            <Gamepad2 className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Matches Needed</div>
                            <div className="text-lg font-bold text-white">
                              {rankProgress.next_requirements.matches.current}/{rankProgress.next_requirements.matches.required}
                            </div>
                            <div className="text-xs text-gray-500">
                              Total for {rankProgress.next_rank_name}
                            </div>
                          </div>
                        </div>
                        <ProgressBar
                          label=""
                          current={rankProgress.next_requirements.matches.current}
                          required={rankProgress.next_requirements.matches.required}
                          percentage={rankProgress.next_requirements.matches.percentage}
                          color={rankProgress.next_requirements.matches.color}
                          icon={Gamepad2}
                        />
                      </div>

                      {/* Win Rate Required for NEXT rank */}
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-purple-500/20">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Win Rate Needed</div>
                            <div className="text-lg font-bold text-white">
                              {rankProgress.next_requirements.win_rate.current}%/{rankProgress.next_requirements.win_rate.required}%
                            </div>
                            <div className="text-xs text-gray-500">
                              For {rankProgress.next_rank_name} rank
                            </div>
                          </div>
                        </div>
                        <ProgressBar
                          label=""
                          current={rankProgress.next_requirements.win_rate.current}
                          required={rankProgress.next_requirements.win_rate.required}
                          percentage={rankProgress.next_requirements.win_rate.percentage}
                          color={rankProgress.next_requirements.win_rate.color}
                          icon={TrendingUp}
                        />
                      </div>
                    </div>
                  )}

                  {/* Next Rank Requirements Summary */}
                  {rankProgress.next_rank && !rankProgress.is_max_rank && (
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="text-purple-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Requirements Summary for {rankProgress.next_rank_name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-800/30 rounded-lg">
                          <div className="text-sm text-gray-400">Total Wins</div>
                          <div className="text-xl font-bold" style={{ color: rankProgress.next_rank_color }}>
                            {rankProgress.next_requirements.wins.required}
                          </div>
                          <div className="text-xs text-gray-500">
                            Current: {rankProgress.next_requirements.wins.current}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-800/30 rounded-lg">
                          <div className="text-sm text-gray-400">Total Matches</div>
                          <div className="text-xl font-bold" style={{ color: rankProgress.next_rank_color }}>
                            {rankProgress.next_requirements.matches.required}
                          </div>
                          <div className="text-xs text-gray-500">
                            Current: {rankProgress.next_requirements.matches.current}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-800/30 rounded-lg">
                          <div className="text-sm text-gray-400">Win Rate</div>
                          <div className="text-xl font-bold" style={{ color: rankProgress.next_rank_color }}>
                            {rankProgress.next_requirements.win_rate.required}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Current: {rankProgress.next_requirements.win_rate.current}%
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-800/30 rounded-lg">
                          <div className="text-sm text-gray-400">Overall Progress</div>
                          <div className="text-xl font-bold" style={{ color: rankProgress.next_rank_color }}>
                            {rankProgress.overall_percentage}%
                          </div>
                          <div className="text-xs text-gray-500">
                            To {rankProgress.next_rank_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Max Rank Message or Rank Up Status */}
                  {rankProgress.is_max_rank ? (
                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 rounded-lg border border-yellow-700">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3">
                          <Crown className="text-yellow-400" size={24} />
                          <div>
                            <h3 className="font-bold text-white">Highest Rank Achieved!</h3>
                            <p className="text-sm text-gray-300">
                              You have reached the Supreme rank. You are at the top!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : rankProgress.can_rank_up ? (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Trophy className="text-yellow-400" size={24} />
                          <div>
                            <h3 className="font-bold text-white">Ready to Rank Up!</h3>
                            <p className="text-sm text-gray-300">
                              You meet all requirements for {rankProgress.next_rank_name} rank
                            </p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition-all">
                          Claim Rank Up
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

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
                    Titles ({userTitles.length})
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

              <div className="p-6">
                {/* Titles Tab Content */}
                {activeTab === 'titles' && (
                  <div>
                    {userTitles.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userTitles.slice(0, 6).map((title, index) => (
                          <div
                            key={index}
                            className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-colors"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 rounded-lg bg-purple-500/20">
                                <Award className="text-purple-400" size={20} />
                              </div>
                              <div>
                                <h3 className="font-bold text-white">{title.name || `Title ${index + 1}`}</h3>
                                <p className="text-sm text-gray-400">{title.description || 'No description'}</p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {title.tier ? title.tier.toUpperCase() : 'TITLE'} • {title.earned_at ? new Date(title.earned_at).toLocaleDateString() : 'Recently'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                          <Award className="text-gray-600" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-400 mb-2">No Titles Earned</h3>
                        <p className="text-gray-500">Play more matches to earn titles!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats Tab Content */}
                {activeTab === 'stats' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard
                      icon={Target}
                      label="K/D Ratio"
                      value={userStats.kd_ratio || '0.00'}
                      color="text-red-400"
                    />
                    <StatCard
                      icon={Zap}
                      label="Headshot %"
                      value={`${userStats.headshot_ratio || '0'}%`}
                      color="text-yellow-400"
                    />
                    <StatCard
                      icon={Award}
                      label="MVP Awards"
                      value={userStats.mvp_awards || '0'}
                      color="text-purple-400"
                    />
                    <StatCard
                      icon={TrendingUp}
                      label="Win Streak"
                      value={userStats.current_streak || '0'}
                      color="text-green-400"
                    />
                    <StatCard
                      icon={Trophy}
                      label="Tournaments Won"
                      value={userStats.tournaments_won || '0'}
                      color="text-blue-400"
                    />
                    <StatCard
                      icon={BarChart}
                      label="Win Rate"
                      value={`${userStats.win_rate || '0'}%`}
                      color="text-green-400"
                    />
                    <StatCard
                      icon={Crown}
                      label="Highest Rank"
                      value={`#${userStats.highest_rank || 'N/A'}`}
                      color="text-yellow-400"
                    />
                    <StatCard
                      icon={CheckCircle}
                      label="Perfect Wins"
                      value={userStats.perfect_wins || '0'}
                      color="text-pink-400"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Account Info */}
          <div className="space-y-8">
            {/* Account Status */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                {isOwnProfile ? 'Your Account' : 'Account Info'}
                {!isOwnProfile && <Eye size={16} className="text-gray-400" />}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    accountStatus === 'active'
                      ? 'bg-green-900/30 text-green-300'
                      : accountStatus === 'suspended'
                      ? 'bg-red-900/30 text-red-300'
                      : 'bg-yellow-900/30 text-yellow-300'
                  }`}>
                    {accountStatusText}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white">
                    {new Date(displayData.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Rank</span>
                  <span className="font-bold" style={{ color: rankProgress?.current_rank_color || '#6366F1' }}>
                    {displayData.rank}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">XP Points</span>
                  <span className="text-yellow-400 font-semibold">
                    {displayData.xp_points || 0}
                  </span>
                </div>
                
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

            {/* Quick Actions */}
            {isOwnProfile && (
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
            )}

            {/* Rank Progress Summary */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Trophy className="text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-white">Rank Progress</h3>
                  <p className="text-sm text-gray-400">Current status</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Current Rank</span>
                  <span className="text-white">{rankProgress?.current_rank || 'E'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Next Rank</span>
                  <span className="text-blue-400">{rankProgress?.next_rank || 'MAX'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-green-400">{rankProgress?.overall_percentage || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-semibold ${
                    rankProgress?.can_rank_up 
                      ? 'text-green-400' 
                      : rankProgress?.is_max_rank 
                      ? 'text-yellow-400' 
                      : 'text-blue-400'
                  }`}>
                    {rankProgress?.can_rank_up 
                      ? 'Ready to Rank Up' 
                      : rankProgress?.is_max_rank 
                      ? 'Max Rank' 
                      : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;