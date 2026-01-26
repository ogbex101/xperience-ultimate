import React, { useState, useEffect } from 'react';
import {
  Download, Calendar, TrendingUp, Users,
  DollarSign, Trophy, Swords, Clock,
  RefreshCw, FileText, Activity, Eye,
  TrendingDown, Percent
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [reportType, setReportType] = useState('financial');
  const [reportHistory, setReportHistory] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformFees: 0,
    activeUsers: 0,
    matchesPlayed: 0,
    netRevenue: 0,
    avgSession: 0,
    pendingWithdrawals: 0,
    totalTournaments: 0
  });

  useEffect(() => {
    loadAnalytics();
    loadReportHistory();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnalytics(selectedPeriod);
      console.log('📊 Analytics response:', response);
      
     // Inside loadAnalytics function, after getting response:
if (response.success) {
  setAnalyticsData(response.analytics);
  
  // Use platform fees directly from response
  const platformFees = response.analytics.summary?.platform_fees || 0;
  
  // Calculate net revenue (total deposits - total withdrawals + platform fees)
  const totalDeposits = response.analytics.summary?.total_deposits || 0;
  const totalWithdrawals = response.analytics.summary?.total_withdrawals || 0;
  const netRevenue = (totalDeposits - totalWithdrawals) + platformFees;
  
  setStats({
    totalRevenue: totalDeposits,
    platformFees: platformFees,
    activeUsers: response.analytics.summary?.active_users || 0,
    matchesPlayed: response.analytics.summary?.total_matches || 0,
    netRevenue: netRevenue,
    avgSession: 0, // Not currently tracked in database
    pendingWithdrawals: response.analytics.summary?.pending_withdrawals || 0,
    totalTournaments: response.analytics.summary?.total_tournaments || 0,
    totalGroups: response.analytics.summary?.total_groups || 0
  });
}
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePlatformFees = (analytics) => {
  try {
    // Use the platform_fees from the new analytics structure
    if (analytics.platform_fee_breakdown) {
      return analytics.platform_fee_breakdown.total_platform_fees || 0;
    }
    
    // Fallback calculation if structure is different
    const matchFees = analytics.platform_fee_breakdown?.match_fees || 0;
    const tournamentFees = analytics.platform_fee_breakdown?.tournament_platform_fees || 0;
    
    return matchFees + tournamentFees;
  } catch (error) {
    console.warn('⚠️ Error calculating platform fees:', error);
    return analytics.summary?.platform_fees || 0;
  }
};

  const loadReportHistory = async () => {
    try {
      const response = await adminAPI.getReportHistory();
      if (response.success) {
        setReportHistory(response.reports);
      }
    } catch (error) {
      console.error('❌ Error loading report history:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const reportData = {
        type: reportType,
        startDate: getStartDate(selectedPeriod),
        endDate: new Date().toISOString().split('T')[0],
        format: 'json'
      };
      
      const response = await adminAPI.generateReport(reportData);
      if (response.success) {
        alert(`✅ Report generated successfully: ${response.report.filename}`);
        loadReportHistory(); // Refresh history
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
      alert('❌ Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStartDate = (period) => {
    const today = new Date();
    const startDate = new Date();
    
    switch(period) {
      case '7d':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(today.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'ytd':
        startDate.setMonth(0, 1); // January 1st
        break;
      case 'all':
        startDate.setFullYear(2020, 0, 1); // From beginning
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    
    return startDate.toISOString().split('T')[0];
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

      {/* Platform Revenue & Fees Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Total Deposits</p>
              <p className="text-2xl font-bold text-white">
                ₦{stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">Real-time data</span>
          </div>
        </div>

        {/* Platform Fees (15%) */}
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Platform Fees (15%)</p>
              <p className="text-2xl font-bold text-white">
                ₦{stats.platformFees.toLocaleString()}
              </p>
            </div>
            <Percent className="w-8 h-8 text-green-400" />
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-400">15% of match stakes & tournament fees</span>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Net Revenue</p>
              <p className="text-2xl font-bold text-white">
                ₦{stats.netRevenue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-400">Deposits - Withdrawals + Fees</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Active Users</p>
              <p className="text-2xl font-bold text-white">
                {stats.activeUsers.toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-400">Last 7 days activity</span>
          </div>
        </div>
      </div>

      {/* Platform Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Matches Played */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-600/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Matches Played</p>
              <p className="text-2xl font-bold text-white">
                {stats.matchesPlayed.toLocaleString()}
              </p>
            </div>
            <Swords className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Tournaments */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-indigo-600/20 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Tournaments</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalTournaments.toLocaleString()}
              </p>
            </div>
            <Trophy className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-gradient-to-r from-pink-500/10 to-pink-600/20 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-white">
                {stats.pendingWithdrawals.toLocaleString()}
              </p>
            </div>
            <Clock className="w-8 h-8 text-pink-400" />
          </div>
        </div>

        {/* Avg Session Time */}
        <div className="bg-gradient-to-r from-teal-500/10 to-teal-600/20 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Avg Session</p>
              <p className="text-2xl font-bold text-white">
                {stats.avgSession}m
              </p>
            </div>
            <Activity className="w-8 h-8 text-teal-400" />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Section */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-6">Revenue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Deposits */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">Total Deposits</h4>
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">₦{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-2">Money deposited by users</p>
          </div>

          {/* Platform Fees */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">Platform Fees (15%)</h4>
              <Percent className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">₦{stats.platformFees.toLocaleString()}</p>
            <div className="text-sm text-gray-400 mt-2">
              <div>• 15% of match stakes</div>
              <div>• 15% of tournament fees</div>
            </div>
          </div>

          {/* Net Revenue */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">Net Revenue</h4>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">₦{stats.netRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-2">Deposits - Withdrawals + Fees</p>
          </div>
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
              <p className="text-sm mt-2">Generate your first report above</p>
            </div>
          ) : (
            reportHistory.slice(0, 5).map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {report.report_type || 'Report'} - {report.filename}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()} • 
                      {report.start_date} to {report.end_date} • 
                      {report.record_count || 0} records
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="View Report"
                    onClick={() => window.open(`/api/admin/reports/${report.id}?download=true`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                    title="Download"
                    onClick={() => window.open(`/api/admin/reports/${report.id}?format=csv`, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-gray-900/30 rounded-lg p-4 border border-gray-700/30">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => adminAPI.generateReport({
              type: 'financial',
              startDate: getStartDate('30d'),
              endDate: new Date().toISOString().split('T')[0],
              format: 'csv'
            })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors text-sm"
          >
            Export Financial Report
          </button>
          <button
            onClick={() => adminAPI.generateReport({
              type: 'user',
              startDate: getStartDate('7d'),
              endDate: new Date().toISOString().split('T')[0],
              format: 'csv'
            })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors text-sm"
          >
            Export User Activity
          </button>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors text-sm"
          >
            Refresh Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;