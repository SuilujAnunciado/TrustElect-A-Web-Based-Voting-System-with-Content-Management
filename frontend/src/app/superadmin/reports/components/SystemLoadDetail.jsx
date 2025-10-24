"use client";

import { useState, useEffect } from 'react';
import { Download, X, Clock, Users, Activity, BarChart2, RefreshCw, AlertTriangle } from "lucide-react";
import { generatePdfReport } from '@/utils/pdfGenerator';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function SystemLoadDetail({ report, onClose, onDownload }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDataReset, setIsDataReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState(report.data || {});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  
  // Ensure data is loaded immediately on component mount
  useEffect(() => {
    // If report data is already available, use it
    if (report.data && Object.keys(report.data).length > 0) {
      setCurrentData(report.data);
    } else {
      // Otherwise fetch data for the default timeframe
      fetchDataForTimeframe(selectedTimeframe);
    }
  }, []);

  // Fetch data based on selected timeframe
  const fetchDataForTimeframe = async (timeframe) => {
    setIsLoading(true);
    try {
      const token = document.cookie.split('token=')[1]?.split(';')[0];
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/reports/system-load?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentData(data.data);
      } else {
        console.error('Failed to fetch data for timeframe:', timeframe);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setSelectedTimeframe(newTimeframe);
    fetchDataForTimeframe(newTimeframe);
  };

  // Filter data by date range
  const filterDataByDateRange = (data, dateFrom, dateTo) => {
    if (!dateFrom && !dateTo) return data;
    
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    
    return data.filter(item => {
      if (!item.timestamp && !item.date) return true;
      
      const itemDate = item.timestamp ? new Date(item.timestamp) : new Date(item.date);
      
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      
      return true;
    });
  };

  // Handle date filter change
  const handleDateFilterChange = (fromDate, toDate) => {
    setDateFrom(fromDate);
    setDateTo(toDate);
    setIsDateFiltered(!!(fromDate || toDate));
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setIsDateFiltered(false);
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatTime = (hour, date = null) => {
    if (hour === undefined || hour === null) return '12:00 AM';
    const hourNum = parseInt(hour);
    if (isNaN(hourNum)) return '12:00 AM';
    
    let timeStr = '';
    if (hourNum === 0) timeStr = '12:00 AM';
    else if (hourNum < 12) timeStr = `${hourNum}:00 AM`;
    else if (hourNum === 12) timeStr = '12:00 PM';
    else timeStr = `${hourNum - 12}:00 PM`;
    
    // Add date if provided
    if (date) {
      const dateObj = new Date(date);
      const dateStr = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return `${dateStr} ${timeStr}`;
    }
    
    return timeStr;
  };

  const formatTimeForChart = (hour, date = null, timestamp = null) => {
    // If we have a timestamp, use it for the most accurate display
    if (timestamp) {
      const dateObj = new Date(timestamp);
      
      // For different timeframes, show different levels of detail
      if (selectedTimeframe === '24h') {
        // For 24h view, just show the hour
        return dateObj.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } else if (selectedTimeframe === '7d') {
        // For 7d view, show day and time
        return `${dateObj.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        })} ${dateObj.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          hour12: true
        })}`;
      } else {
        // For 30d view, show month and day
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric'
        });
      }
    }
    
    // Fallback to the old method if no timestamp is available
    if (hour === undefined || hour === null) return '12 AM';
    const hourNum = parseInt(hour);
    if (isNaN(hourNum)) return '12 AM';
    
    // Show date if available
    let prefix = '';
    if (date) {
      const dateObj = new Date(date);
      prefix = `${dateObj.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      })} `;
    }
    
    // Format hour
    let timeStr = '';
    if (hourNum === 0) timeStr = '12 AM';
    else if (hourNum < 12) timeStr = `${hourNum} AM`;
    else if (hourNum === 12) timeStr = '12 PM';
    else timeStr = `${hourNum - 12} PM`;
    
    return prefix + timeStr;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value || 0;
      const dataPoint = payload[0].payload;
      
      // Use the accurate timestamp information from the data point
      let displayInfo = {
        title: '',
        subtitle: '',
        details: ''
      };
      
      if (dataPoint?.timestamp) {
        const dateObj = new Date(dataPoint.timestamp);
        
        if (selectedTimeframe === '24h') {
          // Show hour and minute for 24h view
          displayInfo.title = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          displayInfo.subtitle = dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } else if (selectedTimeframe === '7d') {
          // Show weekday, date and time for 7d view
          displayInfo.title = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          displayInfo.subtitle = dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } else if (selectedTimeframe === '30d' || selectedTimeframe === '60d' || selectedTimeframe === '90d') {
          // Show full date for multi-day views
          displayInfo.title = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
          displayInfo.subtitle = 'Daily Summary';
        }
      }
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl">
          <p className="text-sm font-semibold mb-1 text-black">{displayInfo.title}</p>
          <p className="text-sm text-gray-600 mb-2">{displayInfo.subtitle}</p>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              payload[0].name === 'Logins' ? 'bg-blue-500' : 'bg-green-500'
            }`}></div>
            <p className="text-sm text-black">
              {payload[0].name}: <span className="font-bold text-black">{Math.round(value).toLocaleString()}</span>
            </p>
          </div>
          {dataPoint?.isSampleData && (
            <p className="text-xs text-yellow-600 mt-1">
              ℹ️ No activity during this period
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const calculateAverage = (data) => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    const validCounts = data.filter(item => item && typeof item.count === 'number' && !isNaN(item.count));
    if (validCounts.length === 0) return 0;
    const sum = validCounts.reduce((acc, curr) => acc + curr.count, 0);
    return Math.round(sum / validCounts.length);
  };

  const findPeakHour = (data) => {
    if (!Array.isArray(data) || data.length === 0) return { hour: 0, count: 0 };
    const validData = data.filter(item => item && typeof item.count === 'number' && !isNaN(item.count));
    if (validData.length === 0) return { hour: 0, count: 0 };
    
    return validData.reduce((peak, current) => 
      current.count > peak.count ? current : peak, 
      validData[0]
    );
  };

  const validateData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      hour: item.hour || item.hour_of_day || 0,
      count: Math.round(typeof item.count === 'number' && !isNaN(item.count) ? item.count : 
             typeof item.login_count === 'number' && !isNaN(item.login_count) ? item.login_count :
             typeof item.vote_count === 'number' && !isNaN(item.vote_count) ? item.vote_count :
             typeof item.activity_count === 'number' && !isNaN(item.activity_count) ? item.activity_count : 0),
      date: item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : null),
      timestamp: item.timestamp || item.date || null
    }));
  };

  const processDataWithDates = (data, timeframe) => {
    if (!Array.isArray(data)) return [];
    
    
    const now = new Date();
    let processedData = [];

    
    if (timeframe === '24h') {
      processedData = data.map(item => ({
        hour: item.hour || 0,
        count: Math.round(typeof item.count === 'number' && !isNaN(item.count) ? item.count : 0),
        date: now.toISOString().split('T')[0], 
        timestamp: now.toISOString()
      }));
    } else if (timeframe === '7d') {
      data.forEach((item, index) => {
        const hour = item.hour || 0;
        const count = Math.round(item.count || 0);
        
        const dayOffset = index % 7;
        const date = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
        
        processedData.push({
          hour: hour, 
          count: count,
          date: date.toISOString().split('T')[0],
          timestamp: date.toISOString()
        });
      });

      processedData.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare === 0) {
          return a.hour - b.hour;
        }
        return dateCompare;
      });
    } else if (timeframe === '30d') {
 
      data.forEach((item, index) => {
        const dayOfMonth = item.hour || 0;
        const count = Math.round(item.count || 0);
        
        // Find the correct date for this day of month
        let targetDate = null;
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          if (checkDate.getDate() === dayOfMonth) {
            targetDate = checkDate;
            break;
          }
        }
        
        if (targetDate && count > 0) {
          // Distribute the count across different times of day
          // Use different hours based on the day to create variety
          const hours = [8, 10, 12, 14, 16, 18, 20]; // Common activity hours
          const hourIndex = index % hours.length;
          const selectedHour = hours[hourIndex];
          
          processedData.push({
            hour: selectedHour, // Use varied hours instead of all 12 PM
            count: count,
            date: targetDate.toISOString().split('T')[0],
            timestamp: targetDate.toISOString()
          });
        }
      });
      
      // Sort by date and hour
      processedData.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare === 0) {
          return a.hour - b.hour;
        }
        return dateCompare;
      });
    }
    
    return processedData;
  };

  const filterDataByTimeframe = (data, timeframe) => {
    if (!Array.isArray(data)) return [];
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeframe) {
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      if (item.timestamp) {
        const itemDate = new Date(item.timestamp);
        return itemDate >= cutoffDate;
      }
      return true; // If no timestamp, include all data
    });
  };

  const timeframeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '60d', label: 'Last 60 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  // Improved data processing with accurate date handling
  const processRawData = (rawData, timeframe) => {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];
    
    // Return data with accurate timestamp information from backend
    return rawData.map((item) => {
      // Use timestamp from backend if available
      if (item.timestamp) {
        const dateObj = new Date(item.timestamp);
        return {
          ...item,
          hour: item.hour || 0,
          count: Math.round(typeof item.count === 'number' && !isNaN(item.count) ? item.count : 0),
          day: item.day || dateObj.getDate(),
          month: item.month || (dateObj.getMonth() + 1),
          year: item.year || dateObj.getFullYear(),
          timestamp: item.timestamp,
          date: item.timestamp.split('T')[0],
          displayTime: new Date(item.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          displayDate: new Date(item.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        };
      }
      return item;
    }).sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  };
  
  // Process data based on selected timeframe with improved accuracy
  let processedLoginData = isDataReset ? [] : processRawData(currentData.login_activity || [], selectedTimeframe);
  let processedVotingData = isDataReset ? [] : processRawData(currentData.voting_activity || [], selectedTimeframe);
  
  // Apply date range filter if active
  if (isDateFiltered && !isDataReset) {
    processedLoginData = filterDataByDateRange(processedLoginData, dateFrom, dateTo);
    processedVotingData = filterDataByDateRange(processedVotingData, dateFrom, dateTo);
  }
  
  // Fallback to original data structure if new processing returns empty data
  if (processedLoginData.length === 0 && currentData.login_activity && currentData.login_activity.length > 0) {
    processedLoginData = validateData(currentData.login_activity);
  }
  
  if (processedVotingData.length === 0 && currentData.voting_activity && currentData.voting_activity.length > 0) {
    processedVotingData = validateData(currentData.voting_activity);
  }
  
  // Find peak hours from processed data
  const loginPeak = findPeakHour(processedLoginData);
  const votingPeak = findPeakHour(processedVotingData);

  // Chart configurations with improved color contrast and data validation
  const chartConfig = {
    login: {
      gradient: {
        id: 'loginGradient',
        color: '#3B82F6'
      },
      data: processedLoginData,
      average: calculateAverage(processedLoginData),
      peak: loginPeak,
      total: processedLoginData.reduce((sum, item) => sum + item.count, 0)
    },
    voting: {
      gradient: {
        id: 'votingGradient',
        color: '#10B981'
      },
      data: processedVotingData,
      average: calculateAverage(processedVotingData),
      peak: votingPeak,
      total: processedVotingData.reduce((sum, item) => sum + item.count, 0)
    }
  };

  const handleDownload = async () => {
    const reportData = {
      title: "System Load Report",
      description: `Analysis of peak usage times and system activity patterns (${timeframeOptions.find(opt => opt.value === selectedTimeframe)?.label})`,
      summary: {
        peak_login_hour: formatTime(chartConfig.login.peak.hour),
        peak_login_count: formatNumber(chartConfig.login.peak.count),
        peak_voting_hour: formatTime(chartConfig.voting.peak.hour),
        peak_voting_count: formatNumber(chartConfig.voting.peak.count),
        total_activity: formatNumber(chartConfig.login.data.reduce((sum, item) => sum + item.count, 0) + 
                                   chartConfig.voting.data.reduce((sum, item) => sum + item.count, 0)),
        login_average: formatNumber(chartConfig.login.average),
        voting_average: formatNumber(chartConfig.voting.average)
      },
      login_activity: chartConfig.login.data.map(activity => ({
        hour: formatTime(activity.hour),
        count: activity.count,
        average: chartConfig.login.average
      })),
      voting_activity: chartConfig.voting.data.map(activity => ({
        hour: formatTime(activity.hour),
        count: activity.count,
        average: chartConfig.voting.average
      })),
      timeframe: selectedTimeframe,
      generated_at: new Date().toLocaleString()
    };

    try {
      await generatePdfReport(7, reportData); // 7 is the report ID for System Load
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/reports/system-load/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
        }
      });

      if (response.ok) {
        toast.success('System load data has been reset successfully!');
        setShowResetConfirm(false);
        
        // Set data reset flag to show empty state immediately
        setIsDataReset(true);
        
        // Refresh the page to show updated data after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to reset system load data');
      }
    } catch (error) {
      console.error('Error resetting system load data:', error);
      toast.error('Failed to reset system load data. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black">System Load Report</h2>
              <p className="text-sm text-black">Peak usage times and system activity</p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm text-black"
                disabled={isLoading}
              >
                {timeframeOptions.map(option => (
                  <option key={option.value} value={option.value} className="text-black">
                    {option.label}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                title="Reset system load data for fresh testing"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Data
              </button>
              <button onClick={onClose} className="text-black hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-sm font-semibold text-black">Filter by Date Range:</h3>
              {isDateFiltered && (
                <button
                  onClick={clearDateFilter}
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-black">From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateFilterChange(e.target.value, dateTo)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-black">To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateFilterChange(dateFrom, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                  min={dateFrom}
                />
              </div>
              {isDateFiltered && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Filtered by date range
                </div>
              )}
            </div>
          </div>

          {/* Empty State Message */}
          {isDataReset && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Data Reset Successfully!</h3>
                  <p className="text-green-700">All system load data has been cleared. Fresh data collection will begin for tomorrow's testing.</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-800">Loading data for {timeframeOptions.find(opt => opt.value === selectedTimeframe)?.label}...</p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-black">Peak Login Hour</h3>
              </div>
              <p className="text-3xl font-bold text-black mb-1">
                {formatTime(chartConfig.login.peak.hour)}
              </p>
              <p className="text-sm text-black">
                {Math.round(chartConfig.login.peak.count).toLocaleString()} logins
              </p>
              <div className="mt-2 text-xs text-blue-600">
                Total: {formatNumber(chartConfig.login.total)} | Avg: {formatNumber(chartConfig.login.average)}/hour
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-black">Peak Voting Hour</h3>
              </div>
              <p className="text-3xl font-bold text-black mb-1">
                {formatTime(chartConfig.voting.peak.hour)}
              </p>
              <p className="text-sm text-black">
                {Math.round(chartConfig.voting.peak.count).toLocaleString()} votes
              </p>
              <div className="mt-2 text-xs text-green-600">
                Total: {formatNumber(chartConfig.voting.total)} | Avg: {formatNumber(chartConfig.voting.average)}/hour
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-black">Total Activity</h3>
              </div>
              <p className="text-3xl font-bold text-black mb-1">
                {Math.round(chartConfig.login.total + chartConfig.voting.total).toLocaleString()}
              </p>
              <p className="text-sm text-black">
                total actions in the last {timeframeOptions.find(opt => opt.value === selectedTimeframe)?.label.toLowerCase()}
              </p>
              <div className="mt-2 text-xs text-purple-600">
                Logins: {formatNumber(chartConfig.login.total)} | Votes: {formatNumber(chartConfig.voting.total)}
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-black">{chartConfig.login.total > 0 ? Math.round(chartConfig.login.total / (chartConfig.login.average || 1)) : 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Avg Login/Hour</p>
              <p className="text-2xl font-bold text-black">{formatNumber(chartConfig.login.average)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Avg Vote/Hour</p>
              <p className="text-2xl font-bold text-black">{formatNumber(chartConfig.voting.average)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Timeframe</p>
              <p className="text-xl font-bold text-black">{timeframeOptions.find(opt => opt.value === selectedTimeframe)?.label}</p>
            </div>
          </div>

          {/* Usage Charts */}
          <div className="space-y-6">
            {/* Login Activity Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              {isDataReset || processedLoginData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <BarChart2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {isDataReset ? 'No Login Data Available' : 'No Login Data for Selected Period'}
                    </h3>
                    <p className="text-gray-500">
                      {isDataReset 
                        ? 'Data has been reset. New login activity will be tracked during testing.'
                        : `No login activity found for the last ${timeframeOptions.find(opt => opt.value === selectedTimeframe)?.label.toLowerCase()}.`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl text-black font-bold">Login Activity</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Peak: {formatTime(chartConfig.login.peak.hour)} ({Math.round(chartConfig.login.peak.count).toLocaleString()} logins)</span>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartConfig.login.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id={chartConfig.login.gradient.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartConfig.login.gradient.color} stopOpacity={0.9}/>
                        <stop offset="95%" stopColor={chartConfig.login.gradient.color} stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour, index) => {
                        const dataPoint = chartConfig.login.data[index];
                        if (!dataPoint) return '';
                        
                        // Format based on timeframe
                        if (selectedTimeframe === '24h') {
                          const dateObj = new Date(dataPoint.timestamp);
                          return dateObj.toLocaleTimeString('en-US', { 
                            hour: 'numeric',
                            hour12: true
                          });
                        } else if (selectedTimeframe === '7d') {
                          const dateObj = new Date(dataPoint.timestamp);
                          return dateObj.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'numeric',
                            day: 'numeric'
                          });
                        } else if (selectedTimeframe === '30d' || selectedTimeframe === '60d' || selectedTimeframe === '90d') {
                          const dateObj = new Date(dataPoint.timestamp);
                          return dateObj.toLocaleDateString('en-US', { 
                            month: 'short',
                            day: 'numeric'
                          });
                        }
                        return hour.toString();
                      }}
                      stroke="#374151"
                      tick={{ 
                        fill: '#374151', 
                        fontSize: 11, 
                        angle: selectedTimeframe === '24h' ? -30 : selectedTimeframe === '7d' ? -45 : -60, 
                        textAnchor: 'end' 
                      }}
                      height={selectedTimeframe === '24h' ? 60 : selectedTimeframe === '7d' ? 80 : 100}
                      axisLine={{ stroke: '#d1d5db' }}
                      interval={selectedTimeframe === '24h' ? 1 : selectedTimeframe === '7d' ? 3 : Math.floor(chartConfig.login.data.length / 10)}
                    />
                    <YAxis 
                      stroke="#374151"
                      tick={{ fill: '#374151', fontSize: 11 }}
                      tickFormatter={(value) => Math.round(value).toLocaleString()}
                      axisLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <ReferenceLine 
                      y={chartConfig.login.average} 
                      label={{ 
                        value: `Avg: ${Math.round(chartConfig.login.average).toLocaleString()}`,
                        position: 'right',
                        fill: '#6b7280',
                        fontSize: 11,
                        fontWeight: 500
                      }} 
                      stroke="#6b7280" 
                      strokeDasharray="5 5" 
                    />
                    <Bar 
                      dataKey="count" 
                      name="Logins" 
                      fill={`url(#${chartConfig.login.gradient.id})`}
                      radius={[6, 6, 0, 0]}
                      animationDuration={2000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
                </>
              )}
            </div>

            {/* Voting Activity Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              {isDataReset || processedVotingData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {isDataReset ? 'No Voting Data Available' : 'No Voting Data for Selected Period'}
                    </h3>
                    <p className="text-gray-500">
                      {isDataReset 
                        ? 'Data has been reset. New voting activity will be tracked during testing.'
                        : `No voting activity found for the last ${timeframeOptions.find(opt => opt.value === selectedTimeframe)?.label.toLowerCase()}.`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl text-black font-bold">Voting Activity</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Peak: {formatTime(chartConfig.voting.peak.hour)} ({Math.round(chartConfig.voting.peak.count).toLocaleString()} votes)</span>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartConfig.voting.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id={chartConfig.voting.gradient.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartConfig.voting.gradient.color} stopOpacity={0.9}/>
                        <stop offset="95%" stopColor={chartConfig.voting.gradient.color} stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour, index) => {
                        const dataPoint = chartConfig.voting.data[index];
                        if (!dataPoint) return '';
                        
                        // Format based on timeframe
                        if (selectedTimeframe === '24h') {
                          const dateObj = new Date(dataPoint.timestamp);
                          return dateObj.toLocaleTimeString('en-US', { 
                            hour: 'numeric',
                            hour12: true
                          });
                        } else if (selectedTimeframe === '7d') {
                          const dateObj = new Date(dataPoint.timestamp);
                          return dateObj.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'numeric',
                            day: 'numeric'
                          });
                        } else if (selectedTimeframe === '30d' || selectedTimeframe === '60d' || selectedTimeframe === '90d') {
                          const dateObj = new Date(dataPoint.timestamp);
                          return dateObj.toLocaleDateString('en-US', { 
                            month: 'short',
                            day: 'numeric'
                          });
                        }
                        return hour.toString();
                      }}
                      stroke="#374151"
                      tick={{ 
                        fill: '#374151', 
                        fontSize: 11, 
                        angle: selectedTimeframe === '24h' ? -30 : selectedTimeframe === '7d' ? -45 : -60, 
                        textAnchor: 'end' 
                      }}
                      height={selectedTimeframe === '24h' ? 60 : selectedTimeframe === '7d' ? 80 : 100}
                      axisLine={{ stroke: '#d1d5db' }}
                      interval={selectedTimeframe === '24h' ? 1 : selectedTimeframe === '7d' ? 3 : Math.floor(chartConfig.voting.data.length / 10)}
                    />
                    <YAxis 
                      stroke="#374151"
                      tick={{ fill: '#374151', fontSize: 11 }}
                      tickFormatter={(value) => Math.round(value).toLocaleString()}
                      axisLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                    />
                    <ReferenceLine 
                      y={chartConfig.voting.average} 
                      label={{ 
                        value: `Avg: ${Math.round(chartConfig.voting.average).toLocaleString()}`,
                        position: 'right',
                        fill: '#6b7280',
                        fontSize: 11,
                        fontWeight: 500
                      }} 
                      stroke="#6b7280" 
                      strokeDasharray="5 5" 
                    />
                    <Bar 
                      dataKey="count" 
                      name="Votes" 
                      fill={`url(#${chartConfig.voting.gradient.id})`}
                      radius={[6, 6, 0, 0]}
                      animationDuration={2000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleDownload}
              className="flex items-center text-white bg-[#01579B] px-4 py-2 rounded hover:bg-[#01416E]"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-black">Reset System Load Data</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to reset all system load data? This action will:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Clear all login activity records</li>
                  <li>Clear all voting activity records</li>
                  <li>Reset peak hour calculations</li>
                  <li>Start fresh data collection for tomorrow's testing</li>
                </ul>
                <p className="text-red-600 font-medium mt-3">
                  ⚠️ This action cannot be undone!
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isResetting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Reset Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}