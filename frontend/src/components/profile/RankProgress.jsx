import React from 'react';
import { 
  Trophy, 
  Gamepad2, 
  TrendingUp, 
  Coins, 
  Swords, 
  Users, 
  User,
  Check,
  X,
  ArrowRight,
  Crown,
  Star,
  Shield,
  Target,
  Award
} from 'lucide-react';

const ProgressBar = ({ label, current, required, percentage, color, icon: Icon, showCheck = false }) => {
  const isComplete = current >= required;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color }} />}
          <span className="text-sm text-gray-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color }}>
            {current}/{required}
          </span>
          {showCheck && (
            isComplete ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <X className="w-4 h-4 text-red-400" />
            )
          )}
        </div>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            background: color,
            boxShadow: `0 0 8px ${color}`
          }}
        />
      </div>
      <div className="text-xs text-gray-400 text-right">
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
};

const RankBadge = ({ rank, name, color, glow, size = 'md' }) => {
  const sizes = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-xl',
    lg: 'w-32 h-32 text-2xl'
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 'SSS': return Crown;
      case 'SS': return Star;
      case 'S': return Trophy;
      case 'A': return Award;
      case 'B': return Shield;
      case 'C': return Target;
      case 'D': return Users;
      default: return User;
    }
  };

  const Icon = getRankIcon(rank);

  return (
    <div className="relative inline-block">
      <div 
        className={`
          ${sizes[size]} 
          rounded-full flex items-center justify-center
          border-4 font-bold
          relative overflow-hidden
        `}
        style={{
          borderColor: color,
          background: 'rgba(0, 0, 0, 0.7)',
          boxShadow: glow || `0 0 20px ${color}40`
        }}
      >
        {/* Animated glow effect */}
        <div 
          className="absolute inset-0 rounded-full animate-pulse opacity-20"
          style={{ background: color }}
        />
        
        <div className="relative z-10 flex flex-col items-center justify-center">
          <Icon className="w-1/2 h-1/2 mb-1" style={{ color }} />
          <span className="font-bold tracking-wider" style={{ color }}>
            {rank}
          </span>
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <div className="text-sm font-semibold" style={{ color }}>{name}</div>
      </div>
    </div>
  );
};

const RankProgress = ({ rankProgress }) => {
  if (!rankProgress) return null;

  const { 
    user, 
    current_rank, 
    next_rank, 
    progress, 
    stats, 
    overall_percentage,
    can_rank_up,
    requirements_met,
    total_requirements 
  } = rankProgress;

  const iconMap = {
    trophy: Trophy,
    gamepad: Gamepad2,
    'trending-up': TrendingUp,
    coins: Coins,
    swords: Swords,
    users: Users,
    user: User
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
      {/* Header with current and next rank */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-4">
          <RankBadge 
            rank={current_rank.rank}
            name={current_rank.name}
            color={current_rank.color}
            glow={current_rank.glow}
            size="lg"
          />
          <div>
            <h2 className="text-2xl font-bold text-white">{current_rank.name}</h2>
            <p className="text-gray-400">Current Rank</p>
            <div className="mt-2 text-sm text-gray-300">
              <div>Wins: <span className="font-bold text-yellow-400">{stats.wins}</span></div>
              <div>Matches: <span className="font-bold text-blue-400">{stats.matches}</span></div>
              <div>Win Rate: <span className="font-bold text-green-400">{stats.win_rate}%</span></div>
            </div>
          </div>
        </div>

        {next_rank && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-300 mb-2">Progress to Next Rank</h3>
              <div className="text-4xl font-bold mb-2" style={{ color: next_rank.color }}>
                {overall_percentage}%
              </div>
              <div className="text-sm text-gray-400">
                {requirements_met}/{total_requirements} requirements met
              </div>
            </div>
            <ArrowRight className="w-8 h-8 text-gray-500" />
            <RankBadge 
              rank={next_rank.rank}
              name={next_rank.name}
              color={next_rank.color || '#FFFFFF'}
              glow={next_rank.glow}
              size="md"
            />
          </div>
        )}
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Overall Progress</span>
          <span className="font-bold text-white">
            {overall_percentage}% ({requirements_met}/{total_requirements})
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${overall_percentage}%`,
              background: `linear-gradient(90deg, ${current_rank.color || '#6366F1'} 0%, ${next_rank?.color || '#8B5CF6'} 100%)`,
              boxShadow: `0 0 15px ${current_rank.color || '#6366F1'}80`
            }}
          />
        </div>
      </div>

      {/* Rank Up Status */}
      {can_rank_up && next_rank && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400" size={24} />
              <div>
                <h3 className="font-bold text-white">Ready to Rank Up!</h3>
                <p className="text-sm text-gray-300">
                  You meet all requirements for {next_rank.name} rank
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition-all">
              Claim Rank Up
            </button>
          </div>
        </div>
      )}

      {/* Individual Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(progress).map(([key, requirement]) => {
          if (requirement.required <= 0) return null;
          
          const Icon = iconMap[requirement.icon] || Trophy;
          
          return (
            <div 
              key={key}
              className={`p-4 rounded-lg border ${requirement.current >= requirement.required ? 'border-green-700 bg-green-900/10' : 'border-gray-700 bg-gray-800/20'}`}
            >
              <ProgressBar
                label={requirement.label}
                current={requirement.current}
                required={requirement.required}
                percentage={requirement.percentage}
                color={requirement.color}
                icon={Icon}
                showCheck={true}
              />
            </div>
          );
        })}
      </div>

      {/* Next Rank Requirements */}
      {next_rank && (
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Target className="text-purple-400" size={24} />
            <h3 className="text-xl font-bold text-white">Requirements for {next_rank.name} Rank</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-400">Wins Required</div>
              <div className="text-xl font-bold" style={{ color: next_rank.color }}>
                {next_rank.min_wins}
              </div>
            </div>
            
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-400">Matches Required</div>
              <div className="text-xl font-bold" style={{ color: next_rank.color }}>
                {next_rank.min_matches}
              </div>
            </div>
            
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-400">Win Rate</div>
              <div className="text-xl font-bold" style={{ color: next_rank.color }}>
                {next_rank.win_rate}%
              </div>
            </div>
            
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-400">Staked Wins</div>
              <div className="text-xl font-bold" style={{ color: next_rank.color }}>
                {next_rank.min_staked_wins || 0}
              </div>
            </div>
            
            {next_rank.min_tournament_wins > 0 && (
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-sm text-gray-400">Tournament Wins</div>
                <div className="text-xl font-bold" style={{ color: next_rank.color }}>
                  {next_rank.min_tournament_wins}
                </div>
              </div>
            )}
            
            {next_rank.min_higher_rank_defeats > 0 && (
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-sm text-gray-400">Higher Rank Defeats</div>
                <div className="text-xl font-bold" style={{ color: next_rank.color }}>
                  {next_rank.min_higher_rank_defeats}
                </div>
              </div>
            )}
            
            {next_rank.min_freeforall_wins > 0 && (
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-sm text-gray-400">Free for All Wins</div>
                <div className="text-xl font-bold" style={{ color: next_rank.color }}>
                  {next_rank.min_freeforall_wins}
                </div>
              </div>
            )}
            
            {next_rank.min_squad_wins > 0 && (
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-sm text-gray400">Squad Wins</div>
                <div className="text-xl font-bold" style={{ color: next_rank.color }}>
                  {next_rank.min_squad_wins}
                </div>
              </div>
            )}
            
            {next_rank.min_onevsone_wins > 0 && (
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-sm text-gray-400">1vs1 Wins</div>
                <div className="text-xl font-bold" style={{ color: next_rank.color }}>
                  {next_rank.min_onevsone_wins}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Rank Info */}
      <div className="mt-6 p-4 bg-gray-800/20 rounded-lg">
        <h4 className="text-sm text-gray-400 mb-2">Current Rank Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Rank Tier</div>
            <div className="font-semibold text-white">{current_rank.rank}</div>
          </div>
          <div>
            <div className="text-gray-500">Color Code</div>
            <div className="font-semibold" style={{ color: current_rank.color }}>
              {current_rank.color}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Target Rank</div>
            <div className="font-semibold text-white">{current_rank.target_rank || 'Highest'}</div>
          </div>
          <div>
            <div className="text-gray-500">Status</div>
            <div className={`font-semibold ${can_rank_up ? 'text-green-400' : 'text-yellow-400'}`}>
              {can_rank_up ? 'Ready for Promotion' : 'In Progress'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankProgress;