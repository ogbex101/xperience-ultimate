import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

const UserProfileLink = ({ userId, username, profilePic, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <Link
      to={`/profile/${userId}`}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      {profilePic && profilePic !== 'default.png' ? (
        <img
          src={profilePic}
          alt={username}
          className={`${sizes[size]} rounded-full object-cover border border-gray-700`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gray-800 flex items-center justify-center`}>
          <User className="text-gray-400" size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />
        </div>
      )}
      <span className="font-medium text-white">{username}</span>
    </Link>
  );
};

export default UserProfileLink;