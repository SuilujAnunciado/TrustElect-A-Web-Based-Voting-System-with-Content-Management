"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Download, Filter, Search, Loader2 } from "lucide-react";
import ReportCard from "./components/ReportCard";
import ReportDetailsModal from "./components/ReportCardDetail";
import ReportFilterModal from "./components/ReportFilterModal";
import RoleBasedUserDetail from "./components/RoleBasedUserDetail";
import FailedLoginDetail from "./components/FailedLoginDetail";
import AuditLogDetail from './components/AuditLogDetail';
import UpcomingElectionDetail from './components/UpcomingElectionDetail';
import LiveVoteCountDetail from './components/LiveVoteCountDetail';
import SystemLoadDetail from './components/SystemLoadDetail';
import VoterParticipationDetail from './components/VoterParticipationDetail';
import CandidateListDetail from './components/CandidateListDetail';
import AdminActivityDetail from './components/AdminActivityDetail';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'superadmin_reports_';

// Heavy reports need longer cache and special handling
const HEAVY_REPORTS = [1, 8]; // Election Summary, Voter Participation
const HEAVY_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for heavy reports

export default function ReportsPage() {
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
      title: "Election Summary Report",
      type: "Election",
      icon: "election",
    },
    {
      id: 2,
      title: "Role Based User Report",
      type: "Users",
      icon: "users",
    },
    {
      id: 3,
      title: "Failed Login Report",
      type: "Security",
      icon: "security",
    },
    {
      id: 4,
      title: "Activity Audit Log Report",
      type: "Audit",
      icon: "audit",
    },
    {
      id: 5,
      title: "Upcoming Elections Report",
      type: "Election",
      icon: "election",
    },
    {
      id: 6,
      title: "Live Vote Count Report",
      type: "Election",
      icon: "election",
    },
    {
      id: 7,
      title: "System Load Report",
      type: "System",
      icon: "system",
    },
    {
      id: 8,
      title: "Voter Participation Report",
      type: "Election",
      icon: "election",
    },
    {
      id: 9,
      title: "Candidate List Report",
      type: "Election",
      icon: "election",
    },
    {
      id: 10,
      title: "Admin Activity Report",
      type: "Admin",
      icon: "admin",
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
            // Election Summary Report - Optimized for superadmin
            endpoint = '/reports/summary';
            const electionResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 6000, // Reduced timeout
              params: {
                summary_only: true,
                limit: 25 // Limit recent elections
              }
            });

            const electionData = electionResponse.data.data;
            transformedData = {
              summary: {
                total_elections: electionData.summary?.total_elections || 0,
                ongoing_elections: electionData.summary?.ongoing_elections || 0,
                completed_elections: electionData.summary?.completed_elections || 0,
                upcoming_elections: electionData.summary?.upcoming_elections || 0,
                total_eligible_voters: electionData.summary?.total_eligible_voters || 0,
                total_votes_cast: electionData.summary?.total_votes_cast || 0,
                voter_turnout_percentage: electionData.summary?.voter_turnout_percentage || 0
              },
              recent_elections: (electionData.recent_elections || []).slice(0, 15).map(election => ({
                id: election.id,
                title: election.title,
                status: election.status,
                election_type: election.election_type,
                start_date: election.start_date,
                end_date: election.end_date,
                voter_count: formatNumber(election.voter_count || 0),
                votes_cast: formatNumber(election.total_votes || 0),
                turnout_percentage: election.voter_turnout_percentage
              })),
              last_updated: new Date().toISOString()
            };
            break;

          case 2: 
            endpoint = '/reports/role-based/summary';
            const userResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });

            const userData = userResponse.data.data;
            if (!userData) {
              throw new Error('No data received from role-based user report');
            }

            transformedData = {
              summary: {
                total_users: userData.summary?.total_users || 0,
                active_users: userData.summary?.active_users || 0,
                inactive_users: userData.summary?.inactive_users || 0
              },
              role_distribution: (userData.role_distribution || []).map(role => ({
                role_name: role.role_name || 'Unknown',
                total_users: role.total_users || 0,
                active_users: role.active_users || 0,
                inactive_users: role.inactive_users || 0
              })),
              users: (userData.users || []).map(user => ({
                name: user.name || 'N/A',
                email: user.email || 'N/A',
                role: user.role || 'N/A',
                department: user.department || 'N/A',
                status: user.status || 'inactive'
              }))
            };
            break;

          case 3: // Failed Login Report
            endpoint = '/reports/failed-logins';
            const loginResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });

            transformedData = {
              total_attempts: loginResponse.data.data.total_attempts,
              locked_accounts: loginResponse.data.data.locked_accounts,
              recent_attempts: loginResponse.data.data.recent_attempts,
              time_distribution: loginResponse.data.data.time_distribution
            };
            break;

          case 4: // Activity Audit Log Report
            endpoint = '/audit-logs';
            const auditResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000,
              params: {
                limit: 50, // Reduced limit for faster loading
                sort_by: 'created_at',
                sort_order: 'DESC'
              }
            });

            // Get summary data
            const auditSummaryResponse = await axios.get(`${API_BASE}/audit-logs/summary`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });

            transformedData = {
              summary: {
                total_activities: auditSummaryResponse.data.data.total_activities || 0,
                unique_users: auditSummaryResponse.data.data.unique_users || 0,
                total_votes: auditSummaryResponse.data.data.total_votes || 0,
                activities_today: auditSummaryResponse.data.data.activities_today || 0
              },
              logs: auditResponse.data.data.map(log => ({
                ...log,
                created_at: new Date(log.created_at).toISOString(),
                details: log.details || {}
              }))
            };
            break;

          case 5: // Upcoming Elections Report
            endpoint = '/reports/upcoming-elections';
            const upcomingResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });

            transformedData = {
              summary: {
                total_upcoming: upcomingResponse.data.data.total_upcoming || 0,
                upcoming_this_month: upcomingResponse.data.data.upcoming_this_month || 0,
                total_expected_voters: upcomingResponse.data.data.total_expected_voters || 0
              },
              upcoming_elections: upcomingResponse.data.data.elections.map(election => ({
                id: election.id,
                title: election.title,
                description: election.description,
                election_type: election.election_type,
                date_from: election.date_from,
                date_to: election.date_to,
                start_time: election.start_time,
                end_time: election.end_time,
                voter_count: election.voter_count || 0,
                ballot: election.ballot || null
              }))
            };
            break;

          case 6: // Live Vote Count Report
            endpoint = '/reports/live-vote-count';
            const liveResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });

            transformedData = {
              summary: liveResponse.data.data.summary,
              live_elections: liveResponse.data.data.live_elections,
              onRefresh: async () => {
                const refreshResponse = await axios.get(`${API_BASE}${endpoint}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setReportData({
                  ...transformedData,
                  summary: refreshResponse.data.data.summary,
                  live_elections: refreshResponse.data.data.live_elections
                });
              }
            };
            break;

          case 7:
            endpoint = '/reports/system-load';
            const loadResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000,
              params: {
                timeframe: '24h'
              }
            });

            transformedData = {
              summary: loadResponse.data.data.summary || {
                peak_login_hour: loadResponse.data.data.peak_login_hour,
                peak_login_count: loadResponse.data.data.peak_login_count,
                peak_voting_hour: loadResponse.data.data.peak_voting_hour,
                peak_voting_count: loadResponse.data.data.peak_voting_count,
                total_active_users: loadResponse.data.data.total_active_users
              },
              login_activity: loadResponse.data.data.login_activity || [],
              voting_activity: loadResponse.data.data.voting_activity || []
            };
            break;

          case 8: // Voter Participation Report - Optimized
            endpoint = '/reports/voter-participation';
            const participationResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 6000, // Reduced timeout
              params: {
                limit: 50, // Limit elections
                include_voter_details: false, // Exclude heavy voter details initially
                summary_only: true
              }
            });

            if (!participationResponse.data.success) {
              throw new Error(participationResponse.data.error || 'Failed to fetch voter participation data');
            }

            const participationData = participationResponse.data.data;
            transformedData = {
              summary: participationData.summary || {},
              elections: (participationData.elections || []).slice(0, 20).map(election => ({
                id: election.id,
                title: election.title,
                total_eligible_voters: election.total_eligible_voters,
                total_votes_cast: election.total_votes_cast,
                turnout_percentage: election.turnout_percentage || 
                  ((election.total_votes_cast / election.total_eligible_voters) * 100).toFixed(1),
                department_stats: election.department_stats || [],
                // Exclude heavy voter details for initial load
                voters_count: election.voters?.length || 0,
                voters_sample: (election.voters || []).slice(0, 10).map(voter => ({
                  student_id: voter.student_id,
                  name: `${voter.first_name} ${voter.last_name}`,
                  department: voter.department,
                  has_voted: voter.has_voted,
                  vote_date: voter.vote_date
                }))
              })),
              last_updated: new Date().toISOString()
            };
            break;

          case 9: // Candidate List Report
            endpoint = '/reports/candidate-list';
            const candidateResponse = await axios.get(`${API_BASE}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });

            if (!candidateResponse.data.success) {
              throw new Error(candidateResponse.data.error || 'Failed to fetch candidate list data');
            }

            transformedData = {
              elections: candidateResponse.data.data.elections
            };
            break;

          case 10: // Admin Activity Report
            endpoint = '/reports/admin-activity/activities';
            const [activitiesResponse, adminSummaryResponse] = await Promise.all([
              axios.get(`${API_BASE}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 8000,
                params: {
                  timeframe: filters.timeframe || 'all',
                  action: filters.action || 'all',
                  page: 1,
                  limit: 50, // Reduced limit for faster loading
                  sort_by: 'created_at',
                  sort_order: 'DESC'
                }
              }),
              axios.get(`${API_BASE}/reports/admin-activity/summary`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 8000,
                params: {
                  timeframe: filters.timeframe || 'all'
                }
              })
            ]);

            if (!activitiesResponse.data.success || !adminSummaryResponse.data.success) {
              throw new Error('Failed to fetch admin activity data');
            }

            transformedData = {
              activities: activitiesResponse.data.data.activities,
              summary: {
                total_activities: activitiesResponse.data.data.summary.total_activities,
                active_admins: activitiesResponse.data.data.summary.active_admins,
                activities_today: activitiesResponse.data.data.summary.activities_today,
                most_common_action: activitiesResponse.data.data.summary.most_common_action
              },
              pagination: activitiesResponse.data.data.pagination
            };
            break;

          default:
            throw new Error('Report type not implemented');
        }

        // Remove the summary number formatting for failed login report
        if (reportId !== 3 && transformedData.summary) {
          Object.keys(transformedData.summary).forEach(key => {
            if (typeof transformedData.summary[key] === 'number') {
              transformedData.summary[key] = formatNumber(transformedData.summary[key]);
            }
          });
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
  }, [getCachedData, setCachedData, formatNumber, filters]);

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

    switch (report.id) {
      case 1:
        return (
          <ReportDetailsModal
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
        );
      case 2:
        return (
          <RoleBasedUserDetail
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
        );
      case 3:
        return (
          <FailedLoginDetail
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
        );
      case 4:
        return (
          <AuditLogDetail
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
        );
      case 5:
        return (
          <UpcomingElectionDetail
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
        );
      case 6:
        return (
          <LiveVoteCountDetail
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
        );
      case 7:
        return (
          <SystemLoadDetail
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
        );
      case 8:
        return (
          <VoterParticipationDetail
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
        );
      case 9:
        return (
          <CandidateListDetail
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
        );
      case 10:
        return (
          <AdminActivityDetail
            report={report}
            onClose={() => setSelectedReport(null)}
            onDownload={() => {
              downloadReport(report.id);
              setSelectedReport(null);
            }}
          />
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
        const commonReports = [1, 2, 7]; // Election Summary, Role Based User, System Load
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
  );
}