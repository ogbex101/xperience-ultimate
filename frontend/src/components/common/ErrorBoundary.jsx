// Create file: frontend/src/components/common/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Component Error:', error);
    console.error('❌ Error Info:', errorInfo.componentStack);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
              <span className="text-red-400 font-bold">!</span>
            </div>
            <h3 className="text-xl font-bold text-red-400">Component Failed to Load</h3>
          </div>
          
          <div className="mb-4 p-3 bg-black/50 rounded">
            <p className="text-gray-300 font-mono text-sm">
              {this.state.error && this.state.error.toString()}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-gray-400">Possible fixes:</p>
            <ul className="text-gray-300 text-sm list-disc pl-5 space-y-1">
              <li>Check component imports for errors</li>
              <li>Verify all dependencies are installed</li>
              <li>Look for circular dependencies</li>
              <li>Check browser console for detailed errors</li>
            </ul>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;