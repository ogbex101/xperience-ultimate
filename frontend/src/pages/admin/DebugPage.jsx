import React from 'react';

const DebugPage = () => {
  console.log('DebugPage loaded - checking if page renders');
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">Debug Page</h1>
      <p className="text-gray-300">If you see this, the route is working</p>
      <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
        <p className="text-green-400">✓ Page loaded successfully</p>
      </div>
    </div>
  );
};

export default DebugPage;