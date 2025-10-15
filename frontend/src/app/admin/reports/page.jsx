"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Download, Filter, Search, Loader2 } from "lucide-react";
import ReportCard from "./components/ReportCard";
import ReportDetailsModal from "./components/ReportDetailsModal";
import ReportFilterModal from "./components/ReportFilterModal";
import DepartmentVoterReport from "./components/DepartmentVoterReport";
import ElectionResultReport from "./components/ElectionResultReport";
import VotingTimeReport from "./components/VotingTimeReport";
import ElectionSummaryReport from "./components/ElectionSummaryReport";
import VoterParticipationReport from "./components/VoterParticipationReport";
import CandidateListReport from "./components/CandidateListReport";
import AdminActivityReport from "./components/AdminActivityReport";
import SystemLoadDetail from "../../superadmin/reports/components/SystemLoadDetail";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'admin_reports_';

// Heavy reports need longer cache and special handling
const HEAVY_REPORTS = [2, 4, 5]; // Election Results, Election Summary, Voter Participation
const HEAVY_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for heavy reports

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    reportType: "All"
  });
  const [loadingReports, setLoadingReports] = useState(new Set());
  const [reportCache, setReportCache] = useState(new Map());

  const staticReports = [
    {
      id: 1,
      title: "Department Voter Report",
      type: "Voters",
      icon: "users",
      description: "Detailed report of voters organized by department and course"
    },
    {
      id: 2,
      title: "Election Result Report",
      type: "Results",
      icon: "election",
      description: "Comprehensive results and statistics for completed elections"
    },
    {
      id: 3,
      title: "Voting Time Report",
      type: "Activity",
      icon: "votes",
      description: "Analysis of voting patterns and time-based participation"
    },
    {
      id: 4,
      title: "Election Summary Report",
      type: "Summary",
      icon: "election",
      description: "Overview of all elections with detailed statistics and voter turnout"
    },
    {
      id: 5,
      title: "Voter Participation Report",
      type: "Participation",
      icon: "participation",
      description: "Detailed analysis of voter participation rates and trends"
    },
    {
      id: 6,
      title: "Candidate List Report",
      type: "Candidates",
      icon: "users",
      description: "Complete list of candidates with their details and affiliations"
    },
    {
      id: 7,
      title: "Admin Activity Report",
      type: "Activity",
      icon: "audit",
      description: "Tracking of administrative actions and system changes"
    },
    {
      id: 8,
      title: "System Load Report",
      type: "System",
      icon: "system",
      description: "Analysis of peak usage times and system activity patterns"
    }
  ];

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Cache management functions
  const getCachedData = useCallback((reportId) => {
    const cacheKey = `${CACHE_PREFIX}${reportId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const cacheDuration = HEAVY_REPORTS.includes(reportId) ? HEAVY_CACHE_DURATION : CACHE_DURATION;
      if (Date.now() - timestamp < cacheDuration) {
        return data;
      }
      localStorage.removeItem(cacheKey);
    }
    return null;
  }, []);

  const setCachedData = useCallback((reportId, data) => {
    const cacheKey = `${CACHE_PREFIX}${reportId}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      isHeavy: HEAVY_REPORTS.includes(reportId)
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    setReportCache(prev => new Map(prev.set(reportId, data)));
  }, []);

  // Optimized data fetching with timeout and caching
  const fetchReportData = useCallback(async (reportId, useCache = true) => {
    try {
      // Check cache first
      if (useCache) {
        const cachedData = getCachedData(reportId);
        if (cachedData) {
          setReportData(cachedData);
          return cachedData;
        }
      }

      setLoadingReports(prev => new Set(prev).add(reportId));
      setError("");
      
      const token = Cookies.get("token");
      if (!token) {
        throw new Error('No authentication token found');
      }

      let endpoint;
      let transformedData;

      // Set timeout for API calls
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const apiCall = async () => {
        switch(reportId) {
          case 1: 
            endpoint = '/reports/department-voter';
            const departmentResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });
            transformedData = departmentResponse.data;
            break;

          case 2: 
            // Election Results Report - Optimized with reduced data
            endpoint = '/reports/admin/summary';
            const resultResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 6000, // Reduced timeout for faster failure
              params: {
                limit: 50, // Limit data size
                include_details: false // Exclude heavy details
              }
            });
            
            // Optimize data structure for faster rendering
            const resultData = resultResponse.data;
            transformedData = {
              summary: resultData.summary || {},
              elections: (resultData.elections || []).slice(0, 20), // Limit to 20 elections
              last_updated: new Date().toISOString()
            };
            break;

          case 3: 
            endpoint = '/reports/voting-time';
            const timeResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });
            transformedData = timeResponse.data;
            break;

          case 4: 
            // Election Summary Report - Optimized with streaming data
            endpoint = '/reports/admin/summary';
            const summaryResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 6000, // Reduced timeout
              params: {
                summary_only: true, // Only fetch summary data initially
                limit: 30
              }
            });
            
            // Process data in chunks to avoid blocking
            const summaryData = summaryResponse.data;
            transformedData = {
              summary: summaryData.summary || {},
              recent_elections: (summaryData.recent_elections || []).slice(0, 15),
              statistics: summaryData.statistics || {},
              last_updated: new Date().toISOString()
            };
            break;

          case 5: 
            // Voter Participation Report - Optimized with pagination and filtering
            endpoint = '/reports/admin/voter-participation';
            const participationResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 6000, // Reduced timeout
              params: {
                limit: 100, // Limit voter data
                include_voter_details: false, // Exclude heavy voter details initially
                summary_only: true
              }
            });
            
            // Optimize voter participation data
            const participationData = participationResponse.data;
            transformedData = {
              summary: participationData.summary || {},
              elections: (participationData.elections || []).map(election => ({
                id: election.id,
                title: election.title,
                total_eligible_voters: election.total_eligible_voters,
                total_votes_cast: election.total_votes_cast,
                turnout_percentage: election.turnout_percentage,
                department_stats: election.department_stats || [],
                // Exclude heavy voter details for initial load
                voters_count: election.voters?.length || 0
              })),
              last_updated: new Date().toISOString()
            };
            break;

          case 6: 
            endpoint = '/reports/candidate-list/admin/candidate-list';
            const candidateResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });
            transformedData = candidateResponse.data;
            break;

          case 7: 
            endpoint = '/reports/admin-activity/summary';
            const activityResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });
            transformedData = activityResponse.data;
            break;

          case 8: 
            endpoint = '/reports/system-load?timeframe=24h';
            const systemLoadResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });
            transformedData = systemLoadResponse.data;
            break;

          default:
            throw new Error('Report type not implemented');
        }
      };

      // Race between API call and timeout
      await Promise.race([apiCall(), timeoutPromise]);

      // Cache the result
      setCachedData(reportId, transformedData);
      setReportData(transformedData);
      return transformedData;

    } catch (error) {
      console.error("Error fetching report data:", error);
      const errorMessage = error.message === 'Request timeout' 
        ? 'Request timed out. Please try again.' 
        : error.message || "Failed to fetch report data";
      setError(errorMessage);
      return null;
    } finally {
      setLoadingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  }, [getCachedData, setCachedData]);


  const handleViewReport = useCallback(async (report) => {
    // Show modal immediately with loading state
    setSelectedReport({ ...report, data: null, loading: true });
    
    // For heavy reports, show immediate feedback
    if (HEAVY_REPORTS.includes(report.id)) {
      // Show a more detailed loading message for heavy reports
      setSelectedReport({ 
        ...report, 
        data: null, 
        loading: true, 
        loadingMessage: "Loading heavy report data... This may take 2-3 seconds" 
      });
    }
    
    // Fetch data in background
    const data = await fetchReportData(report.id);
    if (data) {
      setSelectedReport({ ...report, data, loading: false });
    } else {
      setSelectedReport({ ...report, data: null, loading: false, error: true });
    }
  }, [fetchReportData]);

  const downloadReport = useCallback(async (reportId) => {
    try {
      const data = await fetchReportData(reportId, false); // Force fresh data for download
      
      if (!data) {
        throw new Error('No data available for download');
      }

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
      setError("Failed to download report.");
    }
  }, [fetchReportData]);

  const renderReportDetail = (report) => {
    const isLoading = report?.loading;
    const hasError = report?.error;
    
    if (isLoading) {
      const isHeavyReport = HEAVY_REPORTS.includes(report?.id);
      const loadingMessage = report?.loadingMessage || "Loading report data...";
      
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
              <button 
                onClick={() => setSelectedReport(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex-grow overflow-y-auto flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#01579B]" />
                <p className="text-gray-600">{loadingMessage}</p>
                {isHeavyReport && (
                  <div className="mt-4 space-y-2">
                    <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                      <div className="bg-[#01579B] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                    <p className="text-sm text-gray-500">Optimizing data for faster display...</p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {isHeavyReport ? "This report contains large datasets and may take 2-3 seconds" : "This may take a few seconds"}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
              <button 
                onClick={() => setSelectedReport(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex-grow overflow-y-auto flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <p className="text-red-600 text-lg mb-2">Failed to load report data</p>
                <p className="text-gray-600 mb-4">Please try again or contact support if the problem persists.</p>
                <button 
                  onClick={() => handleViewReport(report)}
                  className="bg-[#01579B] text-white px-4 py-2 rounded hover:bg-[#01416E]"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (report?.id) {
      case 1:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex-grow overflow-y-auto">
                <DepartmentVoterReport />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex-grow overflow-y-auto">
                <ElectionResultReport />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex-grow overflow-y-auto">
                <VotingTimeReport />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex-grow overflow-y-auto">
                <ElectionSummaryReport />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex-grow overflow-y-auto">
                <VoterParticipationReport />
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex-grow overflow-y-auto">
                <CandidateListReport />
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex-grow overflow-y-auto">
                <AdminActivityReport />
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-black">{report.title}</h2>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="text-black hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex-grow overflow-y-auto">
                <SystemLoadDetail 
                  report={report} 
                  onClose={() => setSelectedReport(null)}
                  onDownload={() => downloadReport(report.id)}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Filter reports based on search term and filters
  const filteredReports = useMemo(() => {
    return staticReports.filter(report => {
      // Search term filter
      const searchMatch = searchTerm === "" || 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.type.toLowerCase().includes(searchTerm.toLowerCase());

      // Report type filter
      const typeMatch = filters.reportType === "All" || report.type === filters.reportType;

      return searchMatch && typeMatch;
    });
  }, [staticReports, searchTerm, filters]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  // Initialize page - no initial loading needed since reports are static
  useEffect(() => {
    // Preload cache for better performance
    const preloadCache = async () => {
      const token = Cookies.get("token");
      if (token) {
        // Preload most commonly used reports
        const commonReports = [1, 2, 4]; // Department Voter, Election Result, Election Summary
        commonReports.forEach(reportId => {
          const cached = getCachedData(reportId);
          if (!cached) {
            // Preload in background without showing loading state
            fetchReportData(reportId).catch(console.error);
          }
        });
      }
    };
    
    preloadCache();
  }, [getCachedData, fetchReportData]);

  // Clear error when component unmounts or when new report is selected
  useEffect(() => {
    if (selectedReport) {
      setError("");
    }
  }, [selectedReport]);

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-black">Reports Module</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports by title, description, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 pl-10 rounded w-full text-black placeholder-black/60"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center text-white bg-[#01579B] px-4 py-2 rounded hover:bg-[#01416E]"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {filters.reportType !== "All" && (
              <span className="ml-2 bg-white text-[#01579B] rounded-full w-5 h-5 flex items-center justify-center text-xs">
                ✓
              </span>
            )}
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No reports found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div key={report.id} className="relative">
              <ReportCard
                report={report}
                onView={() => handleViewReport(report)}
                onDownload={() => downloadReport(report.id)}
                isLoading={loadingReports.has(report.id)}
              />
              {loadingReports.has(report.id) && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#01579B]" />
                    <p className="text-sm text-gray-600">Loading...</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedReport && renderReportDetail(selectedReport)}

      {showFilterModal && (
        <ReportFilterModal
          filters={filters}
          onApply={handleFilterApply}
          onClose={() => setShowFilterModal(false)}
        />
      )}
      </div>
    </div>
  );
}
