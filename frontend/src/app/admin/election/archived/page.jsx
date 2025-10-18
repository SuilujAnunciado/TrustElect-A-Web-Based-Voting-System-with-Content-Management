"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, RotateCcw, Trash2, Archive } from 'lucide-react';
import Cookies from 'js-cookie';
import usePermissions from '../../../../hooks/usePermissions';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const RestoreConfirmationModal = ({ isOpen, election, onCancel, onConfirm, isRestoring }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Confirm Restore</h3>
        <p className="mb-6 text-black">
          Are you sure you want to restore the election <span className="font-semibold">{election?.title}</span>? 
          This will move it back to the active elections list.
        </p>  
             
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={isRestoring}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center disabled:opacity-50"
            onClick={onConfirm}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <>
                <span className="mr-2">Restoring...</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </>
            ) : (
              'Restore'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const PermanentDeleteConfirmationModal = ({ isOpen, election, onCancel, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Confirm Permanent Delete</h3>
        <p className="mb-6 text-black">
          Are you sure you want to permanently delete the election <span className="font-semibold">{election?.title}</span>? 
          This action cannot be undone and will remove all election data permanently.
        </p>  
             
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center disabled:opacity-50"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="mr-2">Deleting...</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </>
            ) : (
              'Permanently Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

async function fetchWithAuth(url, options = {}) {
  const token = Cookies.get('token');
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}

const statusColors = {
  ongoing: 'bg-blue-100 text-black border-blue-300',
  upcoming: 'bg-yellow-100 text-black border-yellow-300',
  completed: 'bg-green-100 text-black border-green-300',
  pending: 'bg-purple-100 text-black border-purple-300',
  to_approve: 'bg-purple-100 text-black border-purple-800',
  archived: 'bg-gray-100 text-black border-gray-300',
};

const statusIcons = {
  ongoing: <Clock className="w-5 h-5" />,
  upcoming: <Calendar className="w-5 h-5" />,
  completed: <CheckCircle className="w-5 h-5" />,
  pending: <AlertCircle className="w-5 h-5" />,
  to_approve: <AlertCircle className="w-5 h-5" />,
  archived: <Archive className="w-5 h-5" />
};

export default function ArchivedElectionsPage() {
  const router = useRouter();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [electionToRestore, setElectionToRestore] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [electionToDelete, setElectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const fetchArchivedElections = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch all elections and filter for archived ones (like admin system)
      const data = await fetchWithAuth('/elections');
      
      if (data.success === false) {
        setError(data.message || "Failed to load elections. Please try again later.");
        return;
      }
      
      // Filter for archived elections (is_active = false, is_deleted = false)
      const archivedElections = (data.data || []).filter(election => 
        election.is_active === false && election.is_deleted === false
      );
      
      setElections(archivedElections);
    } catch (err) {
      console.error("Failed to load archived elections:", err);
      
      if (err.message.includes('Request failed')) {
        setError("Failed to load archived elections. Please check your connection and try again.");
      } else {
        setError("Failed to load archived elections. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permissionsLoading && hasPermission('elections', 'view')) {
      fetchArchivedElections();
    } else if (!permissionsLoading) {
      setLoading(false);
    }
  }, [fetchArchivedElections, hasPermission, permissionsLoading]);

  const handleElectionClick = (electionId) => {
    if (!hasPermission('elections', 'view')) {
      alert("You don't have permission to view election details");
      return;
    }
    router.push(`/admin/election/${electionId}`);
  };

  const handleRestoreClick = (election, e) => {
    e.stopPropagation(); // Prevent row click
    if (!hasPermission('elections', 'edit')) {
      alert("You don't have permission to restore elections");
      return;
    }
    setElectionToRestore(election);
    setRestoreModalOpen(true);
  };

  const handleDeleteClick = (election, e) => {
    e.stopPropagation(); // Prevent row click
    if (!hasPermission('elections', 'delete')) {
      alert("You don't have permission to delete elections");
      return;
    }
    setElectionToDelete(election);
    setDeleteModalOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!electionToRestore) return;
    
    try {
      setIsRestoring(true);
      
      await fetchWithAuth(`/elections/${electionToRestore.id}/restore-archive`, {
        method: 'POST'
      });
      
      // Update the elections state to remove the restored election
      setElections(prev => prev.filter(e => e.id !== electionToRestore.id));
      
      setActionMessage({
        type: 'success',
        text: `Election "${electionToRestore.title}" was successfully restored.`
      });
      
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: `Failed to restore election: ${error.message}`
      });
    } finally {
      setIsRestoring(false);
      setRestoreModalOpen(false);
      setElectionToRestore(null);
      
      setTimeout(() => {
        setActionMessage(null);
      }, 5000);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!electionToDelete) return;
    
    try {
      setIsDeleting(true);
      
      await fetchWithAuth(`/elections/${electionToDelete.id}/permanent`, {
        method: 'DELETE'
      });
      
      // Update the elections state to remove the deleted election
      setElections(prev => prev.filter(e => e.id !== electionToDelete.id));
      
      setActionMessage({
        type: 'success',
        text: `Election "${electionToDelete.title}" was permanently deleted.`
      });
      
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: `Failed to delete election: ${error.message}`
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setElectionToDelete(null);
      
      setTimeout(() => {
        setActionMessage(null);
      }, 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (election) => {
    return (
      <div className={`flex items-center px-3 py-1 rounded-full ${statusColors['archived']}`}>
        {statusIcons['archived']}
        <span className="ml-2 text-xs font-medium">ARCHIVED</span>
      </div>
    );
  };

  // Show loading state while permissions are being checked
  if (loading || permissionsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 bg-gray-50 min-h-screen">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-solid border-blue-500"></div>
      </div>
    );
  }
  
  // Only show access denied if permissions have loaded and user definitely doesn't have permission
  if (!permissionsLoading && !hasPermission('elections', 'view')) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mt-4 mb-2 text-black">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to view archived elections. Please contact your administrator for access.
          </p>
          <div className="mt-6">
            <Link href="/admin/election" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Back to Elections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-6">
        <Link href="/admin/election" className="flex items-center text-black hover:text-black mr-4">
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back to Elections</span>
        </Link>
        <h1 className="text-3xl font-bold text-black">Archived Elections</h1>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-black p-4 rounded-lg mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {actionMessage && (
        <div className={`border-l-4 text-black p-4 rounded-lg mb-6 ${
          actionMessage.type === 'success' 
            ? 'bg-green-100 border-green-500' 
            : 'bg-red-100 border-red-500'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {actionMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm">{actionMessage.text}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {elections.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-2/5">
                      Election Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Start Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      End Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Archived By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Archived At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {elections.map((election) => (
                    <tr 
                      key={election.id}
                      onClick={() => handleElectionClick(election.id)}
                      className={`${hasPermission('elections', 'view') ? 'hover:bg-gray-50 cursor-pointer' : ''} transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">{election.title}</div>
                        <div className="text-sm text-black">{election.description?.substring(0, 60)}{election.description?.length > 60 ? '...' : ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(election)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {formatDate(election.date_from)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {formatDate(election.date_to)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {election.archived_by_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {formatDateTime(election.archived_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <div className="flex items-center space-x-2">
                          {hasPermission('elections', 'edit') && (
                            <button
                              onClick={(e) => handleRestoreClick(election, e)}
                              className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50 transition-colors"
                              title="Restore Election"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('elections', 'delete') && (
                            <button
                              onClick={(e) => handleDeleteClick(election, e)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Permanently Delete Election"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-black mb-4">
                <Archive className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-black mb-2">
                No archived elections found
              </h3>
              <p className="text-gray-500 mt-2">
                Archived elections will appear here when you archive completed elections.
              </p>
            </div>
          )}
        </>
      )}

      {/* Restore Confirmation Modal */}
      <RestoreConfirmationModal 
        isOpen={restoreModalOpen}
        election={electionToRestore}
        onCancel={() => setRestoreModalOpen(false)}
        onConfirm={handleRestoreConfirm}
        isRestoring={isRestoring}
      />

      {/* Permanent Delete Confirmation Modal */}
      <PermanentDeleteConfirmationModal 
        isOpen={deleteModalOpen}
        election={electionToDelete}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
