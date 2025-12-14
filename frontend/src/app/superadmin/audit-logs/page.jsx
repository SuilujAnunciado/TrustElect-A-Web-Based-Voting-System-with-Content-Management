"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Toaster, toast } from "react-hot-toast";
import { Calendar, Filter, RefreshCw, Users, Shield, Download } from "lucide-react";

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  
  const [filters, setFilters] = useState({
    activityType: "all",
    userRole: "all",
    dateRange: "all",
    entityId: "",
    startDate: "",
    endDate: ""
  });
  
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  const fetchAuditLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("authToken");
      
      if (!token) {
        setError("Authentication token is missing. Please log in again.");
        setLoading(false);
        return;
      }
 
      const params = new URLSearchParams();
      params.append("page", pageNum);
      params.append("limit", 50);

      if (filters.activityType !== "all") {
        if (filters.activityType === "auth") {
          params.append("action", "LOGIN,LOGOUT,LOGIN_FAILED");
        } else if (filters.activityType === "elections") {
          params.append("entity_type", "elections");
        } else if (filters.activityType === "ballots") {
          params.append("entity_type", "ballots");
        } else if (filters.activityType === "voting") {
          params.append("action", "VOTE");
        } else if (filters.activityType === "approval") {
          params.append("action", "APPROVE,REJECT");
        } else if (filters.activityType === "create") {
          params.append("action", "CREATE,CREATE_ELECTION_WITH_BALLOT");
        } else if (filters.activityType === "update") {
          params.append("action", "UPDATE");
        } else if (filters.activityType === "delete") {
          params.append("action", "DELETE");
        } else if (filters.activityType === "archive") {
          params.append("action", "ARCHIVE,RESTORE");
        } else if (filters.activityType === "upload") {
          params.append("action", "UPLOAD");
        } else if (filters.activityType === "export") {
          params.append("action", "EXPORT");
        } else if (filters.activityType === "password") {
          params.append("action", "PASSWORD_CHANGE,RESET_PASSWORD,FIRST_LOGIN");
        }
      }

      if (filters.userRole !== "all") {
        if (filters.userRole === "Super Admin") {
          params.append("user_role", "Super Admin,SystemAdmin");
        } else {
          params.append("user_role", filters.userRole);
        }
      }

      if (filters.entityId) {
        params.append("entity_id", filters.entityId);
      }

      if (filters.dateRange === "custom" && filters.startDate) {
        params.append("start_date", filters.startDate);
      }
      
      if (filters.dateRange === "custom" && filters.endDate) {
        params.append("end_date", filters.endDate);
      } else if (filters.dateRange === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.append("start_date", today.toISOString());
      } else if (filters.dateRange === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.append("start_date", weekAgo.toISOString());
      } else if (filters.dateRange === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.append("start_date", monthAgo.toISOString());
      }
      
      const res = await axios.get(`${API_BASE}/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      if (res.data && res.data.data) {
        const uniqueLogs = [];
        const seenLogs = new Set();
        
        res.data.data.forEach(log => {
          if (log.action === 'SMS_VERIFIED') {
            return;
          }

          const logKey = `${log.action}-${log.entity_type}-${log.entity_id}-${log.user_id}-${log.user_email}-${new Date(log.created_at).getTime()}`;
          if (!seenLogs.has(logKey)) {
            seenLogs.add(logKey);
            uniqueLogs.push(log);
          }
        });
        
        setLogs(uniqueLogs);
        setPage(res.data.pagination?.page || 1);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalItems(res.data.pagination?.totalItems || 0);
      } else {
        setError("Received invalid data format from server");
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);

      if (error.response) {

        if (error.response.status === 401 || error.response.status === 403) {
          setError("Authorization error. You might not have permission to view audit logs.");
        } else {
          setError(`Server error: ${error.response.data.message || "Unknown error"}`);
        }
      } else if (error.request) {
        setError("Could not connect to the server. Please check your connection.");
      } else {
        setError(`Error: ${error.message}`);
      }
      
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      fetchAuditLogs(newPage);
    }
  };
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const applyFilters = () => {
    setPage(1);
    fetchAuditLogs(1);
  };
  
  const resetFilters = () => {
    setFilters({
      activityType: "all",
      userRole: "all",
      dateRange: "all",
      entityId: "",
      startDate: "",
      endDate: ""
    });
    setPage(1);
    setTimeout(() => {
      fetchAuditLogs(1);
    }, 100);
  };
  
  const exportToCSV = () => {
    try {
      if (!logs || logs.length === 0) {
        toast.error("No logs to export");
        return;
      }

      const headers = ["ID", "Time", "User", "Email", "Role", "Action", "Description"];
      const csvContent = [
        headers.join(","),
        ...logs.map(log => {
          const userName = log.admin_name || log.user_name || log.student_name || 
                          log.details?.admin_name || log.details?.user_name || log.details?.student_name || 
                          'Unknown User';
          const description = getActivityDescription(log).replace(/,/g, ';'); 
          return [
            log.id,
            formatDateTime(log.created_at),
            `"${userName}"`,
            `"${log.user_email || ''}"`,
            log.user_role,
            log.action,
            `"${description}"`
          ].join(",");
        })
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Logs exported successfully");
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast.error("Failed to export logs");
    }
  };
  
  useEffect(() => {
    setPage(1);
    fetchAuditLogs(1);
  }, [filters.activityType, filters.userRole]);
  
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const getDepartmentFromLog = (log) => {
    return (
      log?.details?.department_name ||
      log?.details?.department ||
      log?.department_name ||
      log?.department ||
      log?.user_department ||
      log?.details?.user_department ||
      ''
    );
  };

  const getRoleColor = (role, log) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    const roleLc = role.toLowerCase();
    const deptName = getDepartmentFromLog(log);
    const deptLc = (deptName || '').toLowerCase();
    const isAdministratorDept = deptLc === 'administrator' || deptLc === 'administration' || deptLc === 'system';
    
    if (roleLc === 'admin' && isAdministratorDept) {
      return 'bg-red-100 text-red-800';
    }
    
    switch (roleLc) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'systemadmin': 
      case 'super admin': 
      case 'root admin':
        return 'bg-red-100 text-red-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
 
  const formatRoleDisplay = (role, log) => {
    if (!role) return 'Unknown';
    const roleLc = role.toLowerCase();
    const deptName = getDepartmentFromLog(log);
    const deptLc = (deptName || '').toLowerCase();
    const isAdministratorDept = deptLc === 'administrator' || deptLc === 'administration' || deptLc === 'system';
    
    if (roleLc === 'admin' && isAdministratorDept) return 'System Admin';
    
    switch (roleLc) {
      case 'systemadmin': 
      case 'super admin': 
      case 'root admin':
        return 'Root Admin';
      case 'admin': return 'Admin';
      case 'student': return 'Student';
      default: return role;
    }
  };

  const getActivityDescription = (log) => {
    if (!log) return "-";

    const userFullName = log.admin_name || log.user_name || log.student_name || 
                         log.details?.admin_name || log.details?.user_name || log.details?.student_name || 
                         'Unknown User';
    const timestamp = new Date(log.created_at).toLocaleString();

    const entityId = log.entity_id ? `#${log.entity_id}` : '';
    const electionTitle = log.details?.election_title || log.details?.title || '';
    const candidateName = log.details?.candidate_name || log.details?.name || '';
    const positionName = log.details?.position_name || log.details?.position || '';
    const adminName = log.details?.admin_name || log.details?.email || '';
    const departmentName = log.details?.department_name || '';

    switch (log.action) {
      case 'LOGIN':
        return `${userFullName} logged in successfully on ${timestamp}`;
      case 'LOGIN_FAILED':
        return `Failed login attempt by ${userFullName} on ${timestamp}`;
      case 'LOGOUT':
        return `${userFullName} logged out on ${timestamp}`;
      case 'VOTE':
        if (electionTitle) {
          return `${userFullName} cast a vote in "${electionTitle}" election on ${timestamp}`;
        }
        return `${userFullName} cast a vote in election ${entityId} on ${timestamp}`;
      case 'CREATE':
        if (log.entity_type === 'elections') {
          return electionTitle 
            ? `${userFullName} created election "${electionTitle}" on ${timestamp}` 
            : `${userFullName} created election ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'ballots') {
          return electionTitle
            ? `${userFullName} created ballot for "${electionTitle}" on ${timestamp}`
            : `${userFullName} created ballot ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'candidates') {
          const desc = candidateName 
            ? `candidate "${candidateName}"` 
            : `candidate ${entityId}`;
          return positionName 
            ? `${userFullName} added ${desc} for position "${positionName}" on ${timestamp}`
            : `${userFullName} added ${desc} on ${timestamp}`;
        }
        if (log.entity_type === 'positions') {
          return positionName
            ? `${userFullName} created position "${positionName}" on ${timestamp}`
            : `${userFullName} created position ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'admin') {
          return adminName
            ? `${userFullName} created admin account for ${adminName} on ${timestamp}`
            : `${userFullName} created admin account ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'departments') {
          return departmentName
            ? `${userFullName} created department "${departmentName}" on ${timestamp}`
            : `${userFullName} created department ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'students') {
          const studentName = log.details?.student_name || '';
          return studentName
            ? `${userFullName} added student "${studentName}" on ${timestamp}`
            : `${userFullName} added student ${entityId} on ${timestamp}`;
        }
        return `${userFullName} created ${log.entity_type} ${entityId} on ${timestamp}`;
      case 'CREATE_ELECTION_WITH_BALLOT':
        return electionTitle
          ? `${userFullName} created election "${electionTitle}" with ballot on ${timestamp}`
          : `${userFullName} created election ${entityId} with ballot on ${timestamp}`;
      case 'UPDATE':
        if (log.entity_type === 'elections') {
          return electionTitle
            ? `${userFullName} updated election "${electionTitle}" on ${timestamp}`
            : `${userFullName} updated election ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'ballots') {
          return electionTitle
            ? `${userFullName} updated ballot for "${electionTitle}" on ${timestamp}`
            : `${userFullName} updated ballot ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'candidates') {
          return candidateName
            ? `${userFullName} updated candidate "${candidateName}" on ${timestamp}`
            : `${userFullName} updated candidate ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'positions') {
          return positionName
            ? `${userFullName} updated position "${positionName}" on ${timestamp}`
            : `${userFullName} updated position ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'user' || log.entity_type === 'profile') {
          return `${userFullName} updated their profile on ${timestamp}`;
        }
        if (log.entity_type === 'admin') {
          return adminName
            ? `${userFullName} updated admin account for ${adminName} on ${timestamp}`
            : `${userFullName} updated admin profile on ${timestamp}`;
        }
        if (log.entity_type === 'departments') {
          return departmentName
            ? `${userFullName} updated department "${departmentName}" on ${timestamp}`
            : `${userFullName} updated department ${entityId} on ${timestamp}`;
        }
        return `${userFullName} updated ${log.entity_type} ${entityId} on ${timestamp}`;
      case 'DELETE':
        if (log.entity_type === 'elections') {
          return electionTitle
            ? `${userFullName} deleted election "${electionTitle}" on ${timestamp}`
            : `${userFullName} deleted election ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'candidates') {
          return candidateName
            ? `${userFullName} removed candidate "${candidateName}" on ${timestamp}`
            : `${userFullName} removed candidate ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'positions') {
          return positionName
            ? `${userFullName} removed position "${positionName}" on ${timestamp}`
            : `${userFullName} removed position ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'admin') {
          return adminName
            ? `${userFullName} deactivated admin account for ${adminName} on ${timestamp}`
            : `${userFullName} deactivated admin account ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'departments') {
          return departmentName
            ? `${userFullName} deleted department "${departmentName}" on ${timestamp}`
            : `${userFullName} deleted department ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'students') {
          const studentName = log.details?.student_name || '';
          return studentName
            ? `${userFullName} removed student "${studentName}" on ${timestamp}`
            : `${userFullName} removed student ${entityId} on ${timestamp}`;
        }
        return `${userFullName} deleted ${log.entity_type} ${entityId} on ${timestamp}`;
      case 'APPROVE':
        return electionTitle
          ? `${userFullName} approved election "${electionTitle}" on ${timestamp}`
          : `${userFullName} approved election ${entityId} on ${timestamp}`;
      case 'REJECT':
        return electionTitle
          ? `${userFullName} rejected election "${electionTitle}" on ${timestamp}`
          : `${userFullName} rejected election ${entityId} on ${timestamp}`;
      case 'RESTORE':
        return electionTitle
          ? `${userFullName} restored election "${electionTitle}" on ${timestamp}`
          : `${userFullName} restored election ${entityId} on ${timestamp}`;
      case 'ARCHIVE':
        if (log.entity_type === 'elections') {
          return electionTitle
            ? `${userFullName} archived election "${electionTitle}" on ${timestamp}`
            : `${userFullName} archived election ${entityId} on ${timestamp}`;
        }
        if (log.entity_type === 'admin') {
          return adminName
            ? `${userFullName} archived admin account for ${adminName} on ${timestamp}`
            : `${userFullName} archived admin ${entityId} on ${timestamp}`;
        }
        return `${userFullName} archived ${log.entity_type} ${entityId} on ${timestamp}`;
      case 'UNLOCK':
        return adminName
          ? `${userFullName} unlocked admin account for ${adminName} on ${timestamp}`
          : `${userFullName} unlocked admin account ${entityId} on ${timestamp}`;
      case 'RESET_PASSWORD':
        return adminName
          ? `${userFullName} reset password for ${adminName} on ${timestamp}`
          : `${userFullName} reset password for admin ${entityId} on ${timestamp}`;
      case 'UPLOAD':
        if (log.entity_type === 'students') {
          const count = log.details?.count || '';
          return count
            ? `${userFullName} uploaded ${count} student records on ${timestamp}`
            : `${userFullName} uploaded student records on ${timestamp}`;
        }
        return `${userFullName} uploaded ${log.entity_type} on ${timestamp}`;
      case 'EXPORT':
        return `${userFullName} exported ${log.entity_type} data on ${timestamp}`;
      case 'PASSWORD_CHANGE':
        return `${userFullName} changed their password on ${timestamp}`;
      case 'FIRST_LOGIN':
        return `${userFullName} completed first-time login setup on ${timestamp}`;
      default:
        return `${userFullName} performed ${log.action} on ${log.entity_type} ${entityId} on ${timestamp}`;
    }
  };

  const getActionColor = (action) => {
    if (!action) return 'bg-gray-100 text-gray-800';
    
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'CREATE_ELECTION_WITH_BALLOT': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'LOGIN': return 'bg-purple-100 text-purple-800';
      case 'LOGIN_FAILED': return 'bg-red-100 text-red-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      case 'APPROVE': return 'bg-emerald-100 text-emerald-800';
      case 'REJECT': return 'bg-orange-100 text-orange-800';
      case 'VOTE': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVE': return 'bg-amber-100 text-amber-800';
      case 'RESTORE': return 'bg-cyan-100 text-cyan-800';
      case 'UNLOCK': return 'bg-lime-100 text-lime-800';
      case 'RESET_PASSWORD': return 'bg-indigo-100 text-indigo-800';
      case 'UPLOAD': return 'bg-teal-100 text-teal-800';
      case 'EXPORT': return 'bg-violet-100 text-violet-800';
      case 'PASSWORD_CHANGE': return 'bg-sky-100 text-sky-800';
      case 'FIRST_LOGIN': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="p-4">
      <Toaster position="bottom-center" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-black">Activity Logs</h1>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            <Filter className="w-4 h-4 mr-1" />
            {showFilters ? "Hide Filters" : "Filters"}
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 bg-white p-4 rounded shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <select
                value={filters.activityType}
                onChange={(e) => handleFilterChange('activityType', e.target.value)}
                className="w-full p-2 border rounded text-black"
              >
                <option value="all">All Activities</option>
                <option value="auth">Logins & Logouts</option>
                <option value="elections">Elections</option>
                <option value="ballots">Ballots</option>
                <option value="approval">Approvals/Rejections</option>
                <option value="voting">Voting</option>
                <option value="create">Creation</option>
                <option value="update">Updates</option>
                <option value="delete">Deletion</option>
                <option value="archive">Archives</option>
                <option value="upload">Uploads</option>
                <option value="export">Exports</option>
                <option value="password">Password Changes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Role
              </label>
              <select
                value={filters.userRole}
                onChange={(e) => handleFilterChange('userRole', e.target.value)}
                className="w-full p-2 border rounded text-black"
              >
                <option value="all">All Roles</option>
                <option value="Student">Students</option>
                <option value="Admin">Administrators</option>
                <option value="Super Admin">Root Admins</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full p-2 border rounded text-black"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
          
          {filters.dateRange === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity ID
              </label>
              <input
                type="text"
                value={filters.entityId}
                onChange={(e) => handleFilterChange('entityId', e.target.value)}
                placeholder="e.g. Election ID"
                className="w-full p-2 border rounded text-black"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply
            </button>
            <button 
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 bg-white p-3 rounded shadow-sm flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <select
            value={filters.activityType}
            onChange={(e) => {
              const newValue = e.target.value;
              setFilters(prev => ({ ...prev, activityType: newValue }));
            }}
            className="p-2 border rounded text-black"
          >
            <option value="all">All Activities</option>
            <option value="auth">Logins</option>
            <option value="elections">Elections</option>
            <option value="ballots">Ballots</option>
            <option value="approval">Approvals</option>
            <option value="voting">Voting</option>
            <option value="create">Creation</option>
            <option value="update">Updates</option>
            <option value="delete">Deletion</option>
          </select>
          
          <select
            value={filters.userRole}
            onChange={(e) => {
              const newValue = e.target.value;
              setFilters(prev => ({ ...prev, userRole: newValue }));
            }}
            className="p-2 border rounded text-black"
          >
            <option value="all">All Users</option>
            <option value="Student">Students</option>
            <option value="Admin">Admins</option>
            <option value="Super Admin">Root Admins</option>
          </select>
        </div>
        
        <button 
          onClick={() => fetchAuditLogs(page)}
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded text-red-600 mb-4">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <button
            onClick={() => fetchAuditLogs(1)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Activity list */}
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#01579B] text-white">
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-left">User</th>
                  <th className="p-2 text-left">Action</th>
                  <th className="p-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 whitespace-nowrap text-sm text-black">{formatDateTime(log.created_at)}</td>
                      <td className="p-2">
                        <div className="text-sm text-black font-medium">
                          {log.admin_name || log.user_name || log.student_name || 
                           log.details?.admin_name || log.details?.user_name || log.details?.student_name || 
                           'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500 break-all">
                          {log.user_email || 'N/A'}
                        </div>
                        <div className="text-xs mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full ${getRoleColor(log.user_role, log)}`}>
                            {formatRoleDisplay(log.user_role, log)}
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-black">
                        {getActivityDescription(log)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">
                      No activity logs found with current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} ({totalItems} total)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded ${
                    page === 1 ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white"
                  }`}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded ${
                    page === 1 ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white"
                  }`}
                >
                  Prev
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded ${
                    page === totalPages ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white"
                  }`}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded ${
                    page === totalPages ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white"
                  }`}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 