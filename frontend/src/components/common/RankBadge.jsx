import React from 'react';
import { Crown, Shield, Trophy, Star, Target, Medal } from 'lucide-react';

const RankBadge = ({ rank, name, color, glow, size = 'md', showLabel = true }) => {
  const sizes = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-3xl'
  };

  const iconMap = {
    'SSS': Crown,
    'SS': Trophy,
    'S': Star,
    'A': Medal,
    'B': Shield,
    'C': Shield,
    'D': Shield,
    'E': Target
  };

  const Icon = iconMap[rank] || Shield;

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
          className="absolute inset-0 rounded-full animate-pulse opacity-30"
          style={{ background: color }}
        />
        
        <div className="relative z-10 flex flex-col items-center justify-center">
          <Icon className="w-1/2 h-1/2 mb-1" style={{ color }} />
          <span className="font-bold tracking-wider" style={{ color }}>
            {rank}
          </span>
        </div>
      </div>
      
      {showLabel && (
        <div className="mt-2 text-center">
          <div className="text-sm font-semibold text-gray-300">{name}</div>
          <div 
            className="text-xs mt-1 px-2 py-1 rounded-full font-medium"
            style={{ 
              background: `${color}20`, 
              color 
            }}
          >
            {rank} Rank
          </div>
        </div>
      )}
    </div>
  );
};

export default RankBadge;