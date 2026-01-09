import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();
  
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-container">
        <h1>🔒 Access Denied</h1>
        <p>You don't have permission to access this resource.</p>
        <p className="hint">This may be because:</p>
        <ul>
          <li>You're not logged in</li>
          <li>You don't have the required permissions</li>
          <li>The resource is private</li>
          <li>Your session may have expired</li>
        </ul>
        <div className="action-buttons">
          <button onClick={() => navigate('/login')}>Login</button>
          <button onClick={() => navigate('/')}>Go Home</button>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;