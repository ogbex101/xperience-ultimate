import React, { useState } from 'react';
import { User, Mail, Calendar, Shield, Award, Edit, Save, X } from 'lucide-react';
import RankBadge from '../common/RankBadge';
import { usersAPI } from '../../utils/api'; // CORRECTED IMPORT PATH

const UserInfo = ({ user, isOwnProfile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    firstname: user.firstname || '',
    lastname: user.lastname || '',
    bio: user.bio || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.updateProfile(editedUser);
      
      if (response.success) {
        onUpdate(response.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Profile Picture & Rank */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={user.profile_pic || 'default.png'}
              alt={user.username}
              className="w-32 h-32 rounded-full border-4 border-purple-500 object-cover"
            />
            {user.equipped_title && (
              <div 
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ 
                  background: `${user.equipped_title.color}20`,
                  color: user.equipped_title.color,
                  border: `1px solid ${user.equipped_title.color}`
                }}
              >
                {user.equipped_title.name}
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <RankBadge 
              rank={user.rank}
              name={user.rank_name || `Rank ${user.rank}`}
              color={user.rank_color || '#FFFFFF'}
              glow={user.rank_glow}
              size="lg"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {user.username}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                {user.firstname && user.lastname && (
                  <span className="text-gray-300">
                    {user.firstname} {user.lastname}
                  </span>
                )}
              </div>
            </div>
            
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Matches</div>
              <div className="text-2xl font-bold text-white">{user.matches_played}</div>
              <div className="text-sm text-gray-500">
                {user.wins}W / {user.losses}L
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Win Rate</div>
              <div className="text-2xl font-bold text-green-400">{user.win_rate}%</div>
              <div className="text-sm text-gray-500">Overall</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">XP Points</div>
              <div className="text-2xl font-bold text-yellow-400">{user.xp_points}</div>
              <div className="text-sm text-gray-500">Earned</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-2xl font-bold text-green-400">
                ₦{parseFloat(user.balance).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>

          {/* Bio Section */}
          {isEditing ? (
            <div className="space-y-4">
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
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>{user.email}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield size={16} />
                  <span className="capitalize">{user.account_status}</span>
                </div>
              </div>
              
              {user.bio && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">Bio</h3>
                  <p className="text-gray-200">{user.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInfo;