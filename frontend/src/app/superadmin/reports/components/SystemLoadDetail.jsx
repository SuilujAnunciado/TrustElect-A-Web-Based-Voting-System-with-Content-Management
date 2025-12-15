"use client";
<<<<<<< HEAD
=======

>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
import { useState, useEffect } from 'react';
import { Download, X, Clock, Users, Activity, BarChart2, RefreshCw, AlertTriangle } from "lucide-react";
import { generatePdfReport } from '@/utils/pdfGenerator';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
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
<<<<<<< HEAD

  useEffect(() => {

    if (report.data && Object.keys(report.data).length > 0) {
      setCurrentData(report.data);
    } else {
=======
  
  // Ensure data is loaded immediately on component mount
  useEffect(() => {
    // If report data is already available, use it
    if (report.data && Object.keys(report.data).length > 0) {
      setCurrentData(report.data);
    } else {
      // Otherwise fetch data for the default timeframe
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      fetchDataForTimeframe(selectedTimeframe);
    }
  }, []);

<<<<<<< HEAD
=======
  // Fetch data based on selected timeframe
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
  // Handle timeframe change
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const handleTimeframeChange = (newTimeframe) => {
    setSelectedTimeframe(newTimeframe);
    fetchDataForTimeframe(newTimeframe);
  };

<<<<<<< HEAD
=======
  // Filter data by date range
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
  // Handle date filter change
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const handleDateFilterChange = (fromDate, toDate) => {
    setDateFrom(fromDate);
    setDateTo(toDate);
    setIsDateFiltered(!!(fromDate || toDate));
  };

<<<<<<< HEAD
=======
  // Clear date filter
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD

=======
    
    // Add date if provided
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
    if (timestamp) {
      const dateObj = new Date(timestamp);

      if (selectedTimeframe === '24h') {

=======
    // If we have a timestamp, use it for the most accurate display
    if (timestamp) {
      const dateObj = new Date(timestamp);
      
      // For different timeframes, show different levels of detail
      if (selectedTimeframe === '24h') {
        // For 24h view, just show the hour
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        return dateObj.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } else if (selectedTimeframe === '7d') {
<<<<<<< HEAD
=======
        // For 7d view, show day and time
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        return `${dateObj.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        })} ${dateObj.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          hour12: true
        })}`;
      } else {
<<<<<<< HEAD
=======
        // For 30d view, show month and day
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric'
        });
      }
    }
<<<<<<< HEAD

    if (hour === undefined || hour === null) return '12 AM';
    const hourNum = parseInt(hour);
    if (isNaN(hourNum)) return '12 AM';

=======
    
    // Fallback to the old method if no timestamp is available
    if (hour === undefined || hour === null) return '12 AM';
    const hourNum = parseInt(hour);
    if (isNaN(hourNum)) return '12 AM';
    
    // Show date if available
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    let prefix = '';
    if (date) {
      const dateObj = new Date(date);
      prefix = `${dateObj.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      })} `;
    }
<<<<<<< HEAD

=======
    
    // Format hour
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD

=======
      
      // Use the accurate timestamp information from the data point
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      let displayInfo = {
        title: '',
        subtitle: '',
        details: ''
      };
      
      if (dataPoint?.timestamp) {
        const dateObj = new Date(dataPoint.timestamp);
        
        if (selectedTimeframe === '24h') {
<<<<<<< HEAD
=======
          // Show hour and minute for 24h view
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
          // Show weekday, date and time for 7d view
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
          // Show full date for multi-day views
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
               No activity during this period
=======
              ℹ️ No activity during this period
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD

=======
        
        // Find the correct date for this day of month
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        let targetDate = null;
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          if (checkDate.getDate() === dayOfMonth) {
            targetDate = checkDate;
            break;
          }
        }
        
        if (targetDate && count > 0) {
<<<<<<< HEAD

          const hours = [8, 10, 12, 14, 16, 18, 20]; 
=======
          // Distribute the count across different times of day
          // Use different hours based on the day to create variety
          const hours = [8, 10, 12, 14, 16, 18, 20]; // Common activity hours
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
          const hourIndex = index % hours.length;
          const selectedHour = hours[hourIndex];
          
          processedData.push({
<<<<<<< HEAD
            hour: selectedHour,
=======
            hour: selectedHour, // Use varied hours instead of all 12 PM
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
            count: count,
            date: targetDate.toISOString().split('T')[0],
            timestamp: targetDate.toISOString()
          });
        }
      });
<<<<<<< HEAD

=======
      
      // Sort by date and hour
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
      return true;
    });
  };

  const timeframeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '60d', label: 'Last 60 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const processRawData = (rawData, timeframe) => {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];
    
    return rawData.map((item) => {
      if (item.timestamp) {
        const day = item.day || parseInt(item.timestamp.split('T')[0].split('-')[2]);
        const month = item.month || parseInt(item.timestamp.split('T')[0].split('-')[1]);
        const year = item.year || parseInt(item.timestamp.split('T')[0].split('-')[0]);
        const hour = item.hour || 0;
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const displayDate = `${monthNames[month - 1]} ${day}, ${year}`;
        
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        const displayPeriod = hour < 12 ? 'AM' : 'PM';
        const displayTime = `${displayHour}:00 ${displayPeriod}`;
        
        return {
          ...item,
          hour: hour,
          count: Math.round(typeof item.count === 'number' && !isNaN(item.count) ? item.count : 0),
          day: day,
          month: month,
          year: year,
          timestamp: item.timestamp,
          date: item.timestamp.split('T')[0],
          displayTime: displayTime,
          displayDate: displayDate
        };
      }
      return item;
    }).sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  };
<<<<<<< HEAD

  let processedLoginData = isDataReset ? [] : processRawData(currentData.login_activity || [], selectedTimeframe);
  let processedVotingData = isDataReset ? [] : processRawData(currentData.voting_activity || [], selectedTimeframe);

=======
  
  // Process data based on selected timeframe with improved accuracy
  let processedLoginData = isDataReset ? [] : processRawData(currentData.login_activity || [], selectedTimeframe);
  let processedVotingData = isDataReset ? [] : processRawData(currentData.voting_activity || [], selectedTimeframe);
  
  // Apply date range filter if active
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (isDateFiltered && !isDataReset) {
    processedLoginData = filterDataByDateRange(processedLoginData, dateFrom, dateTo);
    processedVotingData = filterDataByDateRange(processedVotingData, dateFrom, dateTo);
  }
<<<<<<< HEAD

=======
  
  // Fallback to original data structure if new processing returns empty data
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (processedLoginData.length === 0 && currentData.login_activity && currentData.login_activity.length > 0) {
    processedLoginData = validateData(currentData.login_activity);
  }
  
  if (processedVotingData.length === 0 && currentData.voting_activity && currentData.voting_activity.length > 0) {
    processedVotingData = validateData(currentData.voting_activity);
  }
<<<<<<< HEAD

  const loginPeak = findPeakHour(processedLoginData);
  const votingPeak = findPeakHour(processedVotingData);

=======
  
  // Find peak hours from processed data
  const loginPeak = findPeakHour(processedLoginData);
  const votingPeak = findPeakHour(processedVotingData);

  // Calculate data consistency metrics
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const totalLogins = processedLoginData.reduce((sum, item) => sum + item.count, 0);
  const totalDistinctVoters = processedVotingData.reduce((sum, item) => sum + item.count, 0);
  const totalVotes = currentData.summary?.total_votes || 0;
  const voterTurnout = totalLogins > 0 ? ((totalDistinctVoters / totalLogins) * 100).toFixed(1) : 0;
  const avgVotesPerVoter = totalDistinctVoters > 0 ? (totalVotes / totalDistinctVoters).toFixed(2) : 0;

<<<<<<< HEAD
=======
  // Chart configurations with improved color contrast and data validation
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const chartConfig = {
    login: {
      gradient: {
        id: 'loginGradient',
        color: '#3B82F6'
      },
      data: processedLoginData,
      average: calculateAverage(processedLoginData),
      peak: loginPeak,
      total: totalLogins
    },
    voting: {
      gradient: {
        id: 'votingGradient',
        color: '#10B981'
      },
      data: processedVotingData,
      average: calculateAverage(processedVotingData),
      peak: votingPeak,
      total: totalDistinctVoters
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
<<<<<<< HEAD
      await generatePdfReport(7, reportData); 
=======
      await generatePdfReport(7, reportData); // 7 is the report ID for System Load
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD

        setIsDataReset(true);
        
=======
        
        // Set data reset flag to show empty state immediately
        setIsDataReset(true);
        
        // Refresh the page to show updated data after a short delay
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
          {/* Date Range Filter */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
          {/* Empty State Message */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
          {/* Loading Indicator */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-800">Loading data for {timeframeOptions.find(opt => opt.value === selectedTimeframe)?.label}...</p>
              </div>
            </div>
          )}

<<<<<<< HEAD
=======
          {/* Summary Cards */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
                <h3 className="text-sm font-semibold text-black">Peak Voting Activity</h3>
              </div>
              <p className="text-3xl font-bold text-black mb-1">
                {formatTime(chartConfig.voting.peak.hour)}
              </p>
              <p className="text-sm text-black">
                {Math.round(chartConfig.voting.peak.count).toLocaleString()} distinct voters
              </p>
              <div className="mt-2 text-xs text-green-600">
                Total Voters: {formatNumber(chartConfig.voting.total)} | Avg: {formatNumber(chartConfig.voting.average)}/hour
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-black">Data Consistency</h3>
              </div>
              <p className="text-3xl font-bold text-black mb-1">
                {voterTurnout}%
              </p>
              <p className="text-sm text-black">
                Voter turnout rate
              </p>
              <div className="mt-2 text-xs text-purple-600">
                Total Votes: {formatNumber(totalVotes)} | Avg: {avgVotesPerVoter} votes/voter
              </div>
            </div>
          </div>

<<<<<<< HEAD
=======
          {/* Quick Stats Row */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-black">{chartConfig.login.total > 0 ? Math.round(chartConfig.login.total / (chartConfig.login.average || 1)) : 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Distinct Voters</p>
              <p className="text-2xl font-bold text-black">{formatNumber(totalDistinctVoters)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Total Votes</p>
              <p className="text-2xl font-bold text-black">{formatNumber(totalVotes)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Voter Turnout</p>
              <p className="text-2xl font-bold text-black">{voterTurnout}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Timeframe</p>
              <p className="text-xl font-bold text-black">{timeframeOptions.find(opt => opt.value === selectedTimeframe)?.label}</p>
            </div>
          </div>

<<<<<<< HEAD
          <div className="space-y-6">

=======
          {/* Usage Charts */}
          <div className="space-y-6">
            {/* Login Activity Chart */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
                  <AreaChart data={chartConfig.login.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id={chartConfig.login.gradient.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartConfig.login.gradient.color} stopOpacity={0.85}/>
                        <stop offset="95%" stopColor={chartConfig.login.gradient.color} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour, index) => {
                        const dataPoint = chartConfig.login.data[index];
                        if (!dataPoint) return '';
                        
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
                      allowDecimals={false}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: chartConfig.login.gradient.color, strokeOpacity: 0.2 }}
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
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Logins"
                      stroke={chartConfig.login.gradient.color}
                      strokeWidth={3}
                      fill={`url(#${chartConfig.login.gradient.id})`}
                      dot={{ r: 3, strokeWidth: 1, stroke: chartConfig.login.gradient.color, fill: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
                </>
              )}
            </div>

<<<<<<< HEAD
            {/* Voting Activity */}
=======
            {/* Voting Activity Chart */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
                <h3 className="text-xl text-black font-bold">Voting Activity (Distinct Voters)</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Peak: {formatTime(chartConfig.voting.peak.hour)} ({Math.round(chartConfig.voting.peak.count).toLocaleString()} voters)</span>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartConfig.voting.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id={chartConfig.voting.gradient.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartConfig.voting.gradient.color} stopOpacity={0.85}/>
                        <stop offset="95%" stopColor={chartConfig.voting.gradient.color} stopOpacity={0.15}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour, index) => {
                        const dataPoint = chartConfig.voting.data[index];
                        if (!dataPoint) return '';
                        
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
                      label={{ value: 'Distinct Voters', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#374151' } }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: chartConfig.voting.gradient.color, strokeOpacity: 0.2 }}
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
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Distinct Voters"
                      stroke={chartConfig.voting.gradient.color}
                      strokeWidth={3}
                      fill={`url(#${chartConfig.voting.gradient.id})`}
                      dot={{ r: 3, strokeWidth: 1, stroke: chartConfig.voting.gradient.color, fill: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
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

<<<<<<< HEAD
=======
      {/* Reset Confirmation Modal */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
                  This action cannot be undone!
=======
                  ⚠️ This action cannot be undone!
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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