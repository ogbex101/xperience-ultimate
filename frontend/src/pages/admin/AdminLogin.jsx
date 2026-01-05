import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, AlertCircle, Server, CheckCircle, XCircle } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');
  const navigate = useNavigate();

  // Check server status on component mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      console.log('🌐 Checking server status...');
      const response = await fetch('http://localhost:5000/api/admin/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server is running:', data);
        setServerStatus('online');
      } else {
        console.warn('⚠️ Server responded with error:', response.status);
        setServerStatus('error');
      }
    } catch (err) {
      console.error('❌ Cannot connect to server:', err);
      setServerStatus('offline');
    }
  };

  const handleTestLogin = async () => {
    setUsername('admin');
    setPassword('admin@2005');
  };

  const handleClearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 Storage cleared');
    setError('Storage cleared. You can try login again.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    if (serverStatus !== 'online') {
      setError('Server is not reachable. Please check if backend is running on port 5000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting admin login...');
      console.log('Credentials:', { username, password: '***' });
      
      // Clear any existing tokens
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      sessionStorage.clear();

      // Try the test login endpoint first
      console.log('🔄 Trying /admin/login-test endpoint...');
      const testResponse = await fetch('http://localhost:5000/api/admin/login-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      let loginData = null;
      let endpointUsed = '';
      
      if (testResponse.ok) {
        loginData = await testResponse.json();
        endpointUsed = 'test';
        console.log('✅ Test login response:', loginData);
      } else {
        console.log('⚠️ Test endpoint not available, trying regular login...');
        
        // Try regular login endpoint
        console.log('🔄 Trying /admin/login endpoint...');
        const response = await fetch('http://localhost:5000/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
          console.error('❌ Login failed with status:', response.status);
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `Login failed (${response.status})`);
        }
        
        loginData = await response.json();
        endpointUsed = 'regular';
        console.log('✅ Regular login response:', loginData);
      }
      
      if (loginData && loginData.success) {
        // Store admin token and data
        localStorage.setItem('adminToken', loginData.token);
        localStorage.setItem('adminData', JSON.stringify(loginData.admin));
        
        // Clear user tokens to avoid conflicts
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        
        console.log(`🎉 Admin login successful via ${endpointUsed} endpoint`);
        console.log('Token stored:', loginData.token.substring(0, 20) + '...');
        console.log('Admin data:', loginData.admin);
        
        // Show success message briefly
        setError(`✅ Login successful! Redirecting... (via ${endpointUsed} endpoint)`);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1000);
      } else {
        setError(loginData?.message || 'Login failed. Please check credentials.');
      }
      
    } catch (err) {
      console.error('❌ Admin login error:', err);
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to server. Make sure backend is running on port 5000');
      } else if (err.message.includes('401')) {
        setError('Invalid username or password. Try: admin / admin@2005');
      } else {
        setError('Login failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderServerStatus = () => {
    switch (serverStatus) {
      case 'online':
        return (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-800/50 rounded-lg text-green-300 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Backend server is running</span>
          </div>
        );
      case 'offline':
        return (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            <span>Cannot connect to backend server. Make sure it's running on port 5000</span>
          </div>
        );
      case 'error':
        return (
          <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-800/50 rounded-lg text-yellow-300 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Server responded with error. Check backend logs</span>
          </div>
        );
      default:
        return (
          <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 flex items-center">
            <Server className="h-5 w-5 mr-2 animate-pulse" />
            <span>Checking server status...</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-800/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900/30 rounded-full mb-4">
            <Lock className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-gray-400 mt-2">Xperience Gaming Platform</p>
        </div>

        {renderServerStatus()}

        <form onSubmit={handleSubmit}>
          {error && (
            <div className={`mb-6 p-4 rounded-lg flex items-start ${
              error.includes('✅') 
                ? 'bg-green-900/30 border border-green-800/50 text-green-300' 
                : 'bg-red-900/30 border border-red-800/50 text-red-300'
            }`}>
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || serverStatus !== 'online'}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-4"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Authenticating...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Sign In to Admin Panel
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={handleTestLogin}
              disabled={loading}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
            >
              Fill Test Credentials
            </button>
            
            <button
              type="button"
              onClick={handleClearStorage}
              disabled={loading}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
            >
              Clear Storage
            </button>
          </div>

          <div className="border-t border-gray-800/50 pt-6">
            <div className="text-xs text-gray-500 mb-2">
              <p className="font-medium text-gray-400 mb-1">Test Credentials:</p>
              <p>Username: <code className="bg-gray-800 px-1 py-0.5 rounded">admin</code></p>
              <p>Password: <code className="bg-gray-800 px-1 py-0.5 rounded">admin@2005</code></p>
            </div>
            
            <div className="mt-4">
              <p className="text-xs text-gray-500 text-center">
                Restricted access • Authorized personnel only
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Backend: <code>http://localhost:5000</code>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;