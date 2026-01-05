import React, { useState, useEffect } from 'react';
import {
  BarChart3, LineChart, PieChart, Download,
  Calendar, Filter, TrendingUp, Users,
  DollarSign, Trophy, Swords, Clock,
  RefreshCw, FileText, Activity, Eye
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [reportType, setReportType] = useState('financial');
  const [reportHistory, setReportHistory] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadReportHistory();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnalytics(selectedPeriod);
      setAnalyticsData(response.data || response);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportHistory = async () => {
    try {
      const response = await adminAPI.getReportHistory();
      setReportHistory(response.reports || response.data || []);
    } catch (error) {
      console.error('Error loading report history:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const response = await adminAPI.generateReport(
        reportType,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
        'pdf'
      );
      
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      }
      
      loadReportHistory();
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'all', label: 'All Time' }
  ];

  const reportTypes = [
    { value: 'financial', label: 'Financial Report', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'user', label: 'User Activity', icon: <Users className="w-4 h-4" /> },
    { value: 'game', label: 'Game Statistics', icon: <Swords className="w-4 h-4" /> },
    { value: 'tournament', label: 'Tournament Report', icon: <Trophy className="w-4 h-4" /> }
  ];

  // Simple chart data (without recharts)
  const revenueData = [
    { date: 'Jan', revenue: 12000, percentage: 60 },
    { date: 'Feb', revenue: 19000, percentage: 95 },
    { date: 'Mar', revenue: 15000, percentage: 75 },
    { date: 'Apr', revenue: 22000, percentage: 100 },
    { date: 'May', revenue: 18000, percentage: 82 },
    { date: 'Jun', revenue: 25000, percentage: 100 }
  ];

  const userGrowthData = [
    { date: 'Jan', newUsers: 150, activeUsers: 450 },
    { date: 'Feb', newUsers: 200, activeUsers: 520 },
    { date: 'Mar', newUsers: 180, activeUsers: 580 },
    { date: 'Apr', newUsers: 250, activeUsers: 650 },
    { date: 'May', newUsers: 220, activeUsers: 720 },
    { date: 'Jun', newUsers: 300, activeUsers: 850 }
  ];

  const gameDistributionData = [
    { name: 'Call of Duty', value: 35, color: 'bg-blue-500' },
    { name: 'Fortnite', value: 25, color: 'bg-green-500' },
    { name: 'PUBG', value: 15, color: 'bg-yellow-500' },
    { name: 'Valorant', value: 12, color: 'bg-red-500' },
    { name: 'Others', value: 13, color: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Reports & Analytics</h1>
        <p className="text-gray-300">Generate reports, view analytics, and track platform performance</p>
      </div>

      {/* Report Generation Section */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Generate Report</h3>
            <p className="text-gray-400">Select report type and period to generate detailed reports</p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {generatingReport ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`p-3 rounded-lg border transition-all ${
                    reportType === type.value
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <span className={reportType === type.value ? 'text-blue-400' : 'text-gray-400'}>
                      {type.icon}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Time Period
            </label>
            <div className="grid grid-cols-3 gap-3">
              {periods.slice(0, 5).map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedPeriod === period.value
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="text-sm font-medium">{period.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Total Revenue</p>
              <p className="text-2xl font-bold text-white">$142,500</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">+12.5% from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Active Users</p>
              <p className="text-2xl font-bold text-white">2,847</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">+8.2% from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Matches Played</p>
              <p className="text-2xl font-bold text-white">1,243</p>
            </div>
            <Swords className="w-8 h-8 text-purple-400" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">+15.3% from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Avg. Session</p>
              <p className="text-2xl font-bold text-white">24m</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">+5.1% from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Section - Simplified without recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Last 6 Months</span>
            </div>
          </div>
          <div className="space-y-4">
            {revenueData.map((item) => (
              <div key={item.date} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.date}</span>
                  <span className="text-white font-medium">${item.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">User Growth</h3>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Last 6 Months</span>
            </div>
          </div>
          <div className="space-y-4">
            {userGrowthData.map((item) => (
              <div key={item.date} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.date}</span>
                  <div className="flex space-x-4">
                    <span className="text-purple-400">
                      <Users className="inline w-3 h-3 mr-1" />
                      {item.newUsers} new
                    </span>
                    <span className="text-green-400">
                      <Activity className="inline w-3 h-3 mr-1" />
                      {item.activeUsers} active
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${(item.newUsers / 300) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(item.activeUsers / 900) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Distribution & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Game Distribution */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Game Distribution</h3>
            <Swords className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {gameDistributionData.map((game) => (
              <div key={game.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{game.name}</span>
                  <span className="text-white font-medium">{game.value}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${game.color}`}
                    style={{ width: `${game.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Reports</h3>
            <button
              onClick={loadReportHistory}
              className="p-2 text-gray-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {reportHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                <p>No reports generated yet</p>
              </div>
            ) : (
              reportHistory.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{report.name}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(report.created_at).toLocaleDateString()} • {report.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="View Report"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Quick Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Avg. Match Duration</div>
            <div className="text-2xl font-bold text-white">18.5m</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Tournament Win Rate</div>
            <div className="text-2xl font-bold text-green-400">42.3%</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Avg. Stake</div>
            <div className="text-2xl font-bold text-yellow-400">$245</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">User Retention</div>
            <div className="text-2xl font-bold text-blue-400">78.2%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;