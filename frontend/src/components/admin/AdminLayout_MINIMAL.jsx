import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayout_MINIMAL = () => {
  console.log('🟢 ADMIN LAYOUT MINIMAL: MOUNTED!');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      minHeight: '100vh',
      border: '3px solid #00ff00'
    }}>
      <h1 style={{ 
        color: '#4ade80', 
        fontSize: '28px', 
        marginBottom: '20px',
        backgroundColor: '#000',
        padding: '15px',
        borderRadius: '8px'
      }}>
        ✅ MINIMAL ADMIN LAYOUT LOADED - YOU SHOULD SEE THIS!
      </h1>
      <p style={{ color: '#9ca3af', fontSize: '16px', marginBottom: '30px' }}>
        If you see this green box, the problem was in your route structure.
        The original AdminLayout.jsx can now be fixed separately.
      </p>
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        border: '2px solid #3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }}>
        <h2 style={{ color: '#60a5fa', fontSize: '20px', marginBottom: '10px' }}>
          Outlet Content Below (This is where /admin/dashboard appears):
        </h2>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout_MINIMAL;