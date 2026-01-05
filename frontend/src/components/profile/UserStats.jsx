import React from 'react';
import { BarChart3, TrendingUp, Target, Award, Zap, Shield } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = 'text-white', description }) => (
  <div className="bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition-all duration-300">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-lg bg-gray-700/50">
        <Icon className="text-gray-300" size={20} />
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
    <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
    {description && (
      <div className="text-xs text-gray-500">{description}</div>
    )}
  </div>
);

const UserStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-purple-400" size={24} />
        <h2 className="text-xl font-bold text-white">Advanced Stats</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Combat Stats */}
        <StatCard
          icon={Target}
          label="K/D Ratio"
          value={stats.kd_ratio || '0.00'}
          color="text-red-400"
          description="Kills per death"
        />
        
        <StatCard
          icon={Zap}
          label="Headshot Ratio"
          value={`${stats.headshot_ratio || '0'}%`}
          color="text-yellow-400"
          description="Precision shots"
        />
        
        <StatCard
          icon={Award}
          label="MVP Awards"
          value={stats.mvp_awards || '0'}
          color="text-purple-400"
          description="Best in match"
        />
        
        <StatCard
          icon={TrendingUp}
          label="Current Streak"
          value={stats.current_streak || '0'}
          color="text-green-400"
          description="Consecutive wins"
        />

        {/* Tournament Stats */}
        <StatCard
          icon={Shield}
          label="Tournaments Won"
          value={stats.tournaments_won || '0'}
          color="text-blue-400"
          description="Total victories"
        />
        
        <StatCard
          icon={BarChart3}
          label="Win Rate"
          value={`${stats.win_rate || '0'}%`}
          color="text-green-400"
          description="Tournament success"
        />
        
        <StatCard
          icon={Award}
          label="Highest Rank"
          value={stats.highest_rank ? `#${stats.highest_rank}` : 'N/A'}
          color="text-yellow-400"
          description="Peak ranking"
        />
        
        <StatCard
          icon={Zap}
          label="Perfect Wins"
          value={stats.perfect_wins || '0'}
          color="text-pink-400"
          description="Flawless victories"
        />

        {/* Additional Stats if available */}
        {stats.total_kills > 0 && (
          <StatCard
            icon={Target}
            label="Total Kills"
            value={stats.total_kills}
            color="text-red-400"
          />
        )}
        
        {stats.first_bloods > 0 && (
          <StatCard
            icon={Zap}
            label="First Bloods"
            value={stats.first_bloods}
            color="text-orange-400"
          />
        )}
        
        {stats.comeback_wins > 0 && (
          <StatCard
            icon={TrendingUp}
            label="Comeback Wins"
            value={stats.comeback_wins}
            color="text-green-400"
            description="From behind wins"
          />
        )}
        
        {stats.longest_streak > 0 && (
          <StatCard
            icon={Award}
            label="Longest Streak"
            value={stats.longest_streak}
            color="text-purple-400"
            description="Best run"
          />
        )}
      </div>

      {/* Stats Summary */}
      {(stats.total_kills > 0 || stats.total_deaths > 0) && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-800/20 rounded-xl">
            <div className="text-3xl font-bold text-white">{stats.total_kills || '0'}</div>
            <div className="text-sm text-gray-400">Total Kills</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800/20 rounded-xl">
            <div className="text-3xl font-bold text-white">{stats.total_deaths || '0'}</div>
            <div className="text-sm text-gray-400">Total Deaths</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800/20 rounded-xl">
            <div className="text-3xl font-bold text-green-400">{stats.tournaments_played || '0'}</div>
            <div className="text-sm text-gray-400">Tournaments</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800/20 rounded-xl">
            <div className="text-3xl font-bold text-yellow-400">
              {stats.undefeated_rounds || '0'}
            </div>
            <div className="text-sm text-gray-400">Undefeated Rounds</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStats;