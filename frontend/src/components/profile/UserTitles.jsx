import React, { useState } from 'react';
import { Crown, Star, Shield, Award, Check, Zap } from 'lucide-react';
import { usersAPI } from '../../utils/api'; // CORRECTED IMPORT PATH

const TitleCard = ({ title, isEquipped, onEquip, onUnequip, isLoading }) => {
  const tierIcons = {
    sacred: Crown,
    disputable: Star,
    class: Shield
  };

  const TierIcon = tierIcons[title.tier] || Award;

  return (
    <div 
      className="relative group rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02]"
      style={{
        borderColor: title.color,
        background: `linear-gradient(135deg, ${title.color}10 0%, transparent 100%)`
      }}
    >
      {/* Tier Badge */}
      <div 
        className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
        style={{ 
          background: title.color,
          color: '#fff'
        }}
      >
        <TierIcon size={12} />
        <span className="capitalize">{title.tier}</span>
      </div>

      {/* Title Info */}
      <div className="flex items-start gap-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
          style={{ background: `${title.color}20` }}
        >
          {title.icon ? (
            <span className="text-xl">{title.icon}</span>
          ) : (
            <Award style={{ color: title.color }} />
          )}
        </div>
        
        <div className="flex-1">
          <h3 
            className="text-lg font-bold mb-1"
            style={{ color: title.color }}
          >
            {title.name}
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            {title.description}
          </p>
          
          <div className="text-xs text-gray-500">
            Earned: {new Date(title.earned_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4">
        {isEquipped ? (
          <button
            onClick={onUnequip}
            disabled={isLoading}
            className="w-full py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
            style={{
              background: title.color,
              color: '#fff'
            }}
          >
            <Check size={16} />
            Equipped
          </button>
        ) : (
          <button
            onClick={() => onEquip(title.title_id)}
            disabled={isLoading}
            className="w-full py-2 rounded-lg border font-medium transition-all hover:bg-opacity-20"
            style={{
              borderColor: title.color,
              color: title.color,
              background: 'transparent'
            }}
          >
            Equip Title
          </button>
        )}
      </div>
    </div>
  );
};

const UserTitles = ({ titles, userId, isOwnProfile, onTitleEquipped }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleEquipTitle = async (titleId) => {
    try {
      setLoading(true);
      const response = await usersAPI.equipTitle(userId, titleId);
      
      if (response.success) {
        onTitleEquipped(response.data);
      }
    } catch (error) {
      console.error('Error equipping title:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnequipTitle = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.unequipTitle(userId);
      
      if (response.success) {
        onTitleEquipped(null);
      }
    } catch (error) {
      console.error('Error unequipping title:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter titles by tier
  const filteredTitles = activeTab === 'all' 
    ? titles.all
    : titles.by_tier[activeTab] || [];

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Award className="text-yellow-400" size={24} />
          <h2 className="text-xl font-bold text-white">Titles</h2>
        </div>
        <div className="text-sm text-gray-400">
          Total: <span className="font-bold text-white">{titles.total}</span>
        </div>
      </div>

      {/* Tier Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Titles ({titles.total})
        </button>
        
        <button
          onClick={() => setActiveTab('sacred')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'sacred'
              ? 'bg-red-900/30 text-red-300 border border-red-700'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Crown size={14} />
          Sacred ({titles.by_tier.sacred?.length || 0})
        </button>
        
        <button
          onClick={() => setActiveTab('disputable')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'disputable'
              ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Star size={14} />
          Disputable ({titles.by_tier.disputable?.length || 0})
        </button>
        
        <button
          onClick={() => setActiveTab('class')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'class'
              ? 'bg-green-900/30 text-green-300 border border-green-700'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Shield size={14} />
          Class ({titles.by_tier.class?.length || 0})
        </button>
      </div>

      {/* Titles Grid */}
      {filteredTitles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTitles.map(title => (
            <TitleCard
              key={title.id}
              title={title}
              isEquipped={title.is_equipped}
              onEquip={handleEquipTitle}
              onUnequip={handleUnequipTitle}
              isLoading={loading}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <Award className="text-gray-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No Titles Found</h3>
          <p className="text-gray-500">
            {activeTab === 'all' 
              ? "This user hasn't earned any titles yet."
              : `No ${activeTab} titles earned yet.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserTitles;