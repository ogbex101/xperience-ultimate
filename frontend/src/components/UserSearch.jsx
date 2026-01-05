// frontend/src/components/UserSearch.jsx
import React, { useState, useEffect } from 'react';
import { usersAPI } from '../utils/api';
import './UserSearch.css';

const UserSearch = ({ onUserSelect, placeholder = "Search users..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await usersAPI.search(query);
        setResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleUserSelect = (user) => {
    onUserSelect(user);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="user-search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="user-search-input"
      />
      
      {loading && <div className="search-loading">Searching...</div>}
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map(user => (
            <div 
              key={user.id}
              className="search-result-item"
              onClick={() => handleUserSelect(user)}
            >
              <img 
                src={user.profile_pic || '/default-avatar.png'} 
                alt={user.username}
                className="user-avatar"
              />
              <div className="user-info">
                <span className="username">{user.username}</span>
                <span className="user-rank">Rank: {user.rank}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;