"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, ArrowLeft, Trash2, Archive, FolderOpen, RotateCcw } from 'lucide-react';
import Cookies from 'js-cookie';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const DeleteConfirmationModal = ({ isOpen, election, onCancel, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Confirm Delete</h3>
        <p className="mb-6 text-black">
          Are you sure you want to delete the election <span className="font-semibold">{election?.title}</span>?      
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
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ArchiveConfirmationModal = ({ isOpen, election, onCancel, onConfirm, isArchiving }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Confirm Archive</h3>
        <p className="mb-6 text-black">
          Are you sure you want to archive the election <span className="font-semibold">{election?.title}</span>? 
          This will move it to the archived folder where it can be restored later.
        </p>  
             
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={isArchiving}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center disabled:opacity-50"
            onClick={onConfirm}
            disabled={isArchiving}
          >
            {isArchiving ? (
              <>
                <span className="mr-2">Archiving...</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </>
            ) : (
              'Archive'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const SoftDeleteConfirmationModal = ({ isOpen, election, onCancel, onConfirm, isSoftDeleting, autoDeleteDays, setAutoDeleteDays }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Confirm Delete</h3>
        <p className="mb-6 text-black">
          Are you sure you want to delete the election <span className="font-semibold">{election?.title}</span>? 
          This will move it to the deleted folder where it can be restored later.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto-delete after (days):
          </label>
          <select
            value={autoDeleteDays}
            onChange={(e) => setAutoDeleteDays(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSoftDeleting}
          >
            <option value={0}>Never (keep forever)</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
             
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={isSoftDeleting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center disabled:opacity-50"
            onClick={onConfirm}
            disabled={isSoftDeleting}
          >
            {isSoftDeleting ? (
              <>
                <span className="mr-2">Deleting...</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </>
            ) : (
              'Delete'
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
  to_approve: 'bg-purple-100 text-black border-purple-300'
};

const statusIcons = {
  ongoing: <Clock className="w-5 h-5" />,
  upcoming: <Calendar className="w-5 h-5" />,
  completed: <CheckCircle className="w-5 h-5" />,
  to_approve: <AlertCircle className="w-5 h-5" />
};

export default function ElectionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [elections, setElections] = useState([]);
  const [filteredElections, setFilteredElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [electionToDelete, setElectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [electionToArchive, setElectionToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [softDeleteModalOpen, setSoftDeleteModalOpen] = useState(false);
  const [electionToSoftDelete, setElectionToSoftDelete] = useState(null);
  const [isSoftDeleting, setIsSoftDeleting] = useState(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState(30);
  const [tabs, setTabs] = useState([
    { id: 'all', label: 'All Elections' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'to_approve', label: 'To Approve' }
  ]);

  const fetchElections = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const response = await fetchWithAuth('/elections');
      
      if (response.success === false) {
        setError(response.message || "Failed to load elections. Please try again later.");
        setElections([]);
        return;
      }
      
      const data = response.data || [];
      const pendingCount = data.filter(election => {
        // Determine if the creator is a superadmin
        const isSuperAdminCreator =
          election.created_by === 1 ||
          (election.created_by && election.created_by.id === 1) ||
          election.created_by_role === 'SuperAdmin';
        
        // Only count elections that need approval AND are not created by superadmin
        return election.needs_approval && !isSuperAdminCreator;
      }).length;

      const updatedTabs = tabs.map(tab => 
        tab.id === 'to_approve' 
          ? { ...tab, label: `To Approve (${pendingCount})` }
          : tab
      );
      setTabs(updatedTabs);
      
      setElections(data || []);
      
      if (showLoading) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    } catch (err) {
      console.error("Failed to load elections:", err);
      setError("Failed to load elections. Please try again later.");
      setElections([]);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchElections(true);
  }, [fetchElections]);

  useEffect(() => {

    const hasOngoingElections = elections.some(election => election.status === 'ongoing');
    
    if (!hasOngoingElections) return;

    const intervalId = setInterval(() => {
      fetchElections(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [elections, fetchElections]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredElections(elections);
    } else {
      setFilteredElections(
        elections.filter(election => {
          if (activeTab === 'to_approve') {
            // Determine if the creator is a superadmin
            const isSuperAdminCreator =
              election.created_by === 1 ||
              (election.created_by && election.created_by.id === 1) ||
              election.created_by_role === 'SuperAdmin';
            
            // Only show elections that need approval AND are not created by superadmin
            return election.needs_approval && !isSuperAdminCreator;
          } else {
            return election.status === activeTab;
          }
        })
      );
    }
  }, [activeTab, elections]);

  const handleCreateElection = () => {
    router.push("/superadmin/election/create"); 
  };

  const handleElectionClick = (electionId) => {
    router.push(`/superadmin/election/${electionId}`);
  };

  const handleDeleteClick = (election, e) => {
    e.stopPropagation(); // Prevent row click
    setElectionToSoftDelete(election);
    setSoftDeleteModalOpen(true);
  };

  const handleArchiveClick = (election, e) => {
    e.stopPropagation(); // Prevent row click
    setElectionToArchive(election);
    setArchiveModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!electionToDelete) return;
    
    try {
      setIsDeleting(true);
      
      if (electionToDelete.status !== 'completed') {
        setActionMessage({
          type: 'error',
          text: 'Only completed elections can be deleted'
        });
        setDeleteModalOpen(false);
        return;
      }
      
      await fetchWithAuth(`/elections/${electionToDelete.id}`, {
        method: 'DELETE'
      });
      
      // Update the elections state to remove the deleted election
      setElections(prev => prev.filter(e => e.id !== electionToDelete.id));
      setFilteredElections(prev => prev.filter(e => e.id !== electionToDelete.id));
      
      setActionMessage({
        type: 'success',
        text: `Election "${electionToDelete.title}" was successfully deleted.`
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

  const handleArchiveConfirm = async () => {
    if (!electionToArchive) return;
    
    try {
      setIsArchiving(true);
      
      if (electionToArchive.status !== 'completed') {
        setActionMessage({
          type: 'error',
          text: 'Only completed elections can be archived'
        });
        setArchiveModalOpen(false);
        return;
      }
      
      await fetchWithAuth(`/elections/${electionToArchive.id}/archive`, {
        method: 'POST'
      });
      
      // Update the elections state to remove the archived election
      setElections(prev => prev.filter(e => e.id !== electionToArchive.id));
      setFilteredElections(prev => prev.filter(e => e.id !== electionToArchive.id));
      
      setActionMessage({
        type: 'success',
        text: `Election "${electionToArchive.title}" was successfully archived.`
      });
      
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: `Failed to archive election: ${error.message}`
      });
    } finally {
      setIsArchiving(false);
      setArchiveModalOpen(false);
      setElectionToArchive(null);
      
      setTimeout(() => {
        setActionMessage(null);
      }, 5000);
    }
  };

  const handleSoftDeleteConfirm = async () => {
    if (!electionToSoftDelete) return;
    
    try {
      setIsSoftDeleting(true);
      
      if (electionToSoftDelete.status !== 'completed') {
        setActionMessage({
          type: 'error',
          text: 'Only completed elections can be deleted'
        });
        setSoftDeleteModalOpen(false);
        return;
      }
      
      await fetchWithAuth(`/elections/${electionToSoftDelete.id}/soft-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autoDeleteDays: autoDeleteDays
        })
      });
      
      // Update the elections state to remove the soft deleted election
      setElections(prev => prev.filter(e => e.id !== electionToSoftDelete.id));
      setFilteredElections(prev => prev.filter(e => e.id !== electionToSoftDelete.id));
      
      setActionMessage({
        type: 'success',
        text: `Election "${electionToSoftDelete.title}" was successfully deleted.`
      });
      
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: `Failed to delete election: ${error.message}`
      });
    } finally {
      setIsSoftDeleting(false);
      setSoftDeleteModalOpen(false);
      setElectionToSoftDelete(null);
      
      setTimeout(() => {
        setActionMessage(null);
      }, 5000);
    }
  };

  const handleArchivedFolderClick = () => {
    router.push('/superadmin/election/archived');
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

  const getStatusBadge = (election) => {
    // Determine if the creator is a superadmin
    const isSuperAdminCreator =
      election.created_by === 1 ||
      (election.created_by && election.created_by.id === 1) ||
      election.created_by_role === 'SuperAdmin';

    // Only show 'NEEDS APPROVAL' if not created by super admin
    const status = (election.needs_approval && !isSuperAdminCreator) ? 'to_approve' : election.status;
    
    return (
      <div className={`flex items-center px-3 py-1 rounded-full ${statusColors[status]}`}>
        {statusIcons[status]}
        <span className="ml-2 text-xs font-medium">
          {(election.needs_approval && !isSuperAdminCreator) ? 'NEEDS APPROVAL' : election.status.toUpperCase()}
        </span>
      </div>
    );
  };

  const manualRefresh = () => {
    fetchElections(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-6">
        <Link href="/superadmin" className="flex items-center text-black hover:text-black mr-4">
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back</span>
        </Link>
        <h1 className="text-3xl font-bold text-black">Elections</h1>
        
      </div>

      <div className="mb-6 flex justify-end space-x-3">
        <button 
          onClick={() => router.push('/superadmin/election/archived')} 
          className="bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors flex items-center shadow-sm"
        >
          <Archive className="w-5 h-5 mr-2" />
          Archived
        </button>
        <button 
          onClick={() => router.push('/superadmin/election/deleted')} 
          className="bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-sm"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Deleted
        </button>
        <button 
          onClick={handleCreateElection} 
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Election
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-6 py-3 text-sm font-medium focus:outline-none transition-colors ${
                activeTab === tab.id 
                  ? 'text-black border-b-2 border-blue-600' 
                  : 'text-black hover:text-black hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
          {filteredElections.length > 0 ? (
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
                    {activeTab === 'to_approve' && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Created By
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredElections.map((election) => (
                    <tr 
                      key={election.id}
                      onClick={() => handleElectionClick(election.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
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
                      {activeTab === 'to_approve' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {election.created_by ? (
                            <div>
                              <div className="font-medium">{election.created_by.name || 'Unknown Admin'}</div>
                              <div className="text-xs text-gray-500">{election.created_by.department || 'No Department'}</div>
                            </div>
                          ) : (
                            <div className="text-gray-500">Unknown</div>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {election.status === 'completed' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleArchiveClick(election, e)}
                              className="text-gray-600 hover:text-gray-800 p-1 rounded-md hover:bg-gray-50 transition-colors"
                              title="Archive Election"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(election, e)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete Election"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-black mb-4">
                {activeTab === 'ongoing' && <Clock className="w-16 h-16 mx-auto" />}
                {activeTab === 'upcoming' && <Calendar className="w-16 h-16 mx-auto" />}
                {activeTab === 'completed' && <CheckCircle className="w-16 h-16 mx-auto" />}
                {activeTab === 'to_approve' && <AlertCircle className="w-16 h-16 mx-auto" />}
                {activeTab === 'all' && <div className="w-16 h-16 mx-auto" />}
              </div>
              <h3 className="text-xl font-medium text-black mb-2">
                No {activeTab === 'all' ? '' : activeTab} elections found
              </h3>
              <p className="text-black max-w-md mx-auto">
                Create a new election to get started.
              </p>
            </div>
          )}
        </>
      )}


      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        election={electionToDelete}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Archive Confirmation Modal */}
      <ArchiveConfirmationModal 
        isOpen={archiveModalOpen}
        election={electionToArchive}
        onCancel={() => setArchiveModalOpen(false)}
        onConfirm={handleArchiveConfirm}
        isArchiving={isArchiving}
      />

      {/* Soft Delete Confirmation Modal */}
      <SoftDeleteConfirmationModal 
        isOpen={softDeleteModalOpen}
        election={electionToSoftDelete}
        onCancel={() => setSoftDeleteModalOpen(false)}
        onConfirm={handleSoftDeleteConfirm}
        isSoftDeleting={isSoftDeleting}
        autoDeleteDays={autoDeleteDays}
        setAutoDeleteDays={setAutoDeleteDays}
      />
    </div>
  );
}
