// Create file: frontend/src/pages/admin/TestPage.jsx
import React from 'react';

const TestPage = () => {
  console.log('✅ TestPage loaded successfully');
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Admin Test Page</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-green-400">✓ Layout Working</h3>
          <p className="text-gray-300 text-sm">AdminLayout is rendering correctly</p>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-green-400">✓ Routes Working</h3>
          <p className="text-gray-300 text-sm">Nested routing is functional</p>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-green-400">✓ Auth Working</h3>
          <p className="text-gray-300 text-sm">AdminRoute protection is active</p>
        </div>
      </div>
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300">If you see this page, the admin system structure is working perfectly.</p>
        <p className="text-gray-400 text-sm mt-2">The issue is with your specific admin page components.</p>
      </div>
    </div>
  );
};

export default TestPage;