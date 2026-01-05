import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader, User, Trophy, BarChart, Award, Gamepad2, Target, Shield, Star, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../utils/api';
import UserInfo from '../components/profile/UserInfo';
import RankProgress from '../components/profile/RankProgress';
import UserTitles from '../components/profile/UserTitles';
import UserStats from '../components/profile/UserStats';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [rankProgress, setRankProgress] = useState(null);
  const [titles, setTitles] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const isOwnProfile = currentUser && id === currentUser.id.toString();

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const profileResponse = await usersAPI.getProfile(id);
      
      if (!profileResponse.success) {
        throw new Error(profileResponse.error || 'Failed to load profile');
      }

      setProfileData(profileResponse.data);

      // Fetch rank progress
      const rankResponse = await usersAPI.getRankProgress(id);
      if (rankResponse.success) {
        setRankProgress(rankResponse.data);
      }

      // Fetch user titles
      const titlesResponse = await usersAPI.getUserTitles(id);
      if (titlesResponse.success) {
        setTitles(titlesResponse.data);
      }

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleEquipped = (equippedTitle) => {
    // Update profile data with equipped title
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
            <User className="text-red-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Info */}
            <UserInfo 
              user={profileData}
              isOwnProfile={isOwnProfile}
              onUpdate={setProfileData}
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
                
                {activeTab === 'stats' && profileData.stats && (
                  <UserStats stats={profileData.stats} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Wallet Account</span>
                  <span className="font-mono text-white">
                    {profileData.wallet_account_number}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Account Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    profileData.account_status === 'active'
                      ? 'bg-green-900/30 text-green-300'
                      : profileData.account_status === 'suspended'
                      ? 'bg-red-900/30 text-red-300'
                      : 'bg-yellow-900/30 text-yellow-300'
                  }`}>
                    {profileData.account_status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white">
                    {new Date(profileData.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                
                {profileData.is_admin && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Admin Role</span>
                    <span className="text-purple-400 font-semibold">
                      {profileData.admin_role || 'Admin'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Rank Progress Section - CORRECT IMPLEMENTATION */}
            {rankProgress && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Rank Progress</h2>
                  </div>
                  <div className="text-sm text-gray-400">
                    Current: <span className="font-bold" style={{ color: rankProgress.current_rank.color }}>
                      {rankProgress.current_rank.name} ({rankProgress.current_rank.rank})
                    </span>
                    {rankProgress.next_rank && (
                      <>
                        <span className="mx-2">→</span>
                        Next: <span className="font-bold" style={{ color: rankProgress.next_rank.color }}>
                          {rankProgress.next_rank.name} ({rankProgress.next_rank.rank})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress to {rankProgress.next_rank ? rankProgress.next_rank.name : 'Max'} Rank</span>
                    <span className="font-bold text-white">
                      {rankProgress.overall_percentage}%
                      {rankProgress.next_rank && (
                        <span className="text-gray-400 ml-2">
                          ({rankProgress.requirements_met}/{rankProgress.total_requirements})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${rankProgress.overall_percentage}%`,
                        background: rankProgress.next_rank ? 
                          `linear-gradient(90deg, ${rankProgress.current_rank.color} 0%, ${rankProgress.next_rank.color} 100%)` :
                          rankProgress.current_rank.color,
                        boxShadow: `0 0 10px ${rankProgress.current_rank.color}`
                      }}
                    />
                  </div>
                </div>

                {/* Rank Cards - Using NEXT RANK requirements */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Wins Card */}
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
                        <Trophy className="text-yellow-400" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Wins Required</h3>
                        <p className="text-xs text-gray-400">
                          {rankProgress.next_rank ? `For ${rankProgress.next_rank.name} Rank` : 'Current Rank'}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">
                      {rankProgress.stats.wins}/{rankProgress.progress.wins.required}
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-yellow-500"
                        style={{ 
                          width: `${Math.min(100, rankProgress.progress.wins.percentage)}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-right">
                      {Math.min(100, rankProgress.progress.wins.percentage).toFixed(1)}%
                    </div>
                  </div>

                  {/* Matches Card */}
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                        <Gamepad2 className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Matches Required</h3>
                        <p className="text-xs text-gray-400">
                          {rankProgress.next_rank ? `For ${rankProgress.next_rank.name} Rank` : 'Current Rank'}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">
                      {rankProgress.stats.matches}/{rankProgress.progress.matches.required}
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-blue-500"
                        style={{ 
                          width: `${Math.min(100, rankProgress.progress.matches.percentage)}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-right">
                      {Math.min(100, rankProgress.progress.matches.percentage).toFixed(1)}%
                    </div>
                  </div>

                  {/* Win Rate Card */}
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center">
                        <BarChart className="text-green-400" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Win Rate Required</h3>
                        <p className="text-xs text-gray-400">
                          {rankProgress.next_rank ? `For ${rankProgress.next_rank.name} Rank` : 'Current Rank'}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-400 mb-2">
                      {rankProgress.stats.win_rate}%/{rankProgress.progress.win_rate.required}%
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-green-500"
                        style={{ 
                          width: `${Math.min(100, rankProgress.progress.win_rate.percentage)}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-right">
                      {Math.min(100, rankProgress.progress.win_rate.percentage).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Additional Requirements - Only show if NEXT rank has them */}
                {rankProgress.next_rank && (
                  (rankProgress.next_rank.min_staked_wins > 0 || 
                   rankProgress.next_rank.min_tournament_wins > 0 ||
                   rankProgress.next_rank.min_higher_rank_defeats > 0 ||
                   rankProgress.next_rank.min_freeforall_wins > 0 ||
                   rankProgress.next_rank.min_squad_wins > 0 ||
                   rankProgress.next_rank.min_onevsone_wins > 0) && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-white mb-4">Additional Requirements for {rankProgress.next_rank.name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {rankProgress.next_rank.min_staked_wins > 0 && (
                          <div className="bg-gray-800/20 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">Staked Wins</div>
                            <div className="text-lg font-bold text-white">
                              {rankProgress.stats.staked_wins || 0}/{rankProgress.next_rank.min_staked_wins}
                            </div>
                            <div className="text-xs text-gray-500">≥₦{rankProgress.next_rank.min_stake_amount || 0}</div>
                          </div>
                        )}

                        {rankProgress.next_rank.min_tournament_wins > 0 && (
                          <div className="bg-gray-800/20 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">Tournament Wins</div>
                            <div className="text-lg font-bold text-white">
                              {rankProgress.stats.tournament_wins || 0}/{rankProgress.next_rank.min_tournament_wins}
                            </div>
                          </div>
                        )}

                        {rankProgress.next_rank.min_higher_rank_defeats > 0 && (
                          <div className="bg-gray-800/20 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">Defeat {rankProgress.next_rank.target_rank} Ranks</div>
                            <div className="text-lg font-bold text-white">
                              {rankProgress.stats.higher_rank_defeats || 0}/{rankProgress.next_rank.min_higher_rank_defeats}
                            </div>
                          </div>
                        )}

                        {rankProgress.next_rank.min_freeforall_wins > 0 && (
                          <div className="bg-gray-800/20 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">Free for All Wins</div>
                            <div className="text-lg font-bold text-white">
                              {rankProgress.stats.freeforall_wins || 0}/{rankProgress.next_rank.min_freeforall_wins}
                            </div>
                          </div>
                        )}

                        {rankProgress.next_rank.min_squad_wins > 0 && (
                          <div className="bg-gray-800/20 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">Squad Wins</div>
                            <div className="text-lg font-bold text-white">
                              {rankProgress.stats.squad_wins || 0}/{rankProgress.next_rank.min_squad_wins}
                            </div>
                          </div>
                        )}

                        {rankProgress.next_rank.min_onevsone_wins > 0 && (
                          <div className="bg-gray-800/20 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">1vs1 Wins</div>
                            <div className="text-lg font-bold text-white">
                              {rankProgress.stats.onevsone_wins || 0}/{rankProgress.next_rank.min_onevsone_wins}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Quick Actions (only for own profile) */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;