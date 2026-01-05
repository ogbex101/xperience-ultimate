import React from 'react';
import './FriendsList.css';

const FriendsList = ({ friends = [] }) => {
  return (
    <div className="friends-list">
      <h3>Friends List</h3>
      {friends.length === 0 ? (
        <p>No friends yet. Add some friends!</p>
      ) : (
        <ul>
          {friends.map(friend => (
            <li key={friend.id} className="friend-item">
              <div className="friend-info">
                <span className="friend-name">{friend.username}</span>
                <span className={`friend-status ${friend.online ? 'online' : 'offline'}`}>
                  {friend.online ? 'Online' : 'Offline'}
                </span>
              </div>
              <button className="message-btn">Message</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;