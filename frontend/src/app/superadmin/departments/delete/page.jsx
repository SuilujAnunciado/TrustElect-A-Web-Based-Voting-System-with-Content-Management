"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

export default function DeletedDepartmentsPage() {
  const router = useRouter();
  const [deletedDepartments, setDeletedDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAutoDeleteModal, setShowAutoDeleteModal] = useState(false);
  const [showDisableAutoDeleteModal, setShowDisableAutoDeleteModal] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState(7);

  const fetchDeletedDepartments = async () => {
    try {
      const token = Cookies.get("token");
      let departmentsArray = [];
      let success = false;

      try {
        const res = await axios.get("/api/superadmin/departments", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        const allDepartments = res.data.departments || res.data || [];
        departmentsArray = allDepartments.filter(dept => dept.is_deleted === true);
        success = true;
      } catch (firstError) {
        console.warn("Error on superadmin endpoint, trying fallback:", firstError.message);
    
        
        try {
          const res = await axios.get("/api/admin/departments", {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          const allDepartments = res.data.departments || res.data || [];
          departmentsArray = allDepartments.filter(dept => dept.is_deleted === true);
          success = true;
        } catch (secondError) {
          console.error("Error on admin endpoint:", secondError.message);
          throw new Error("Failed to load departments after trying all endpoints");
        }
      }

      if (success) {
        setDeletedDepartments(departmentsArray);
        setFilteredDepartments(departmentsArray);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching deleted departments:", error);
      setError("Failed to load deleted departments.");
      setLoading(false);
    }
  };


  const enableAutoDelete = () => {
    setShowAutoDeleteModal(true);
  };

  const confirmEnableAutoDelete = () => {
    setAutoDeleteEnabled(true);
    toast.success(`Auto-deletion enabled for ${autoDeleteDays} days`);

    const timer = setTimeout(() => {
      performAutoDelete();
    }, autoDeleteDays * 24 * 60 * 60 * 1000); 

    localStorage.setItem('autoDeleteTimer', timer.toString());
    setShowAutoDeleteModal(false);
  };

  const disableAutoDelete = () => {
    setShowDisableAutoDeleteModal(true);
  };

  const confirmDisableAutoDelete = () => {
    setAutoDeleteEnabled(false);
    const timerId = localStorage.getItem('autoDeleteTimer');
    if (timerId) {
      clearTimeout(parseInt(timerId));
      localStorage.removeItem('autoDeleteTimer');
    }
    toast.success("Auto-deletion disabled");
    setShowDisableAutoDeleteModal(false);
  };

  const performAutoDelete = async () => {
    try {
      const token = Cookies.get("token");
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (autoDeleteDays * 24 * 60 * 60 * 1000));
      
      const departmentsToDelete = filteredDepartments.filter(dept => {
        if (!dept.deleted_at) return false;
        const deletedDate = new Date(dept.deleted_at);
        return deletedDate <= cutoffDate;
      });

      if (departmentsToDelete.length === 0) {
        toast.info("No departments found for auto-deletion");
        return;
      }

      for (const dept of departmentsToDelete) {
        try {
          await axios.delete(`/api/superadmin/departments/${dept.id}/permanent`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
        } catch (error) {
          console.error(`Error auto-deleting department ${dept.id}:`, error);
        }
      }

      toast.success(`${departmentsToDelete.length} departments auto-deleted successfully`);
      fetchDeletedDepartments();
      setAutoDeleteEnabled(false);
      localStorage.removeItem('autoDeleteTimer');
    } catch (error) {
      console.error("Error performing auto-deletion:", error);
      toast.error("Failed to perform auto-deletion");
    }
  };

  const confirmPermanentDelete = (id) => {
    setSelectedDepartmentId(id);
    setShowConfirmModal(true);
  };

  const permanentlyDeleteDepartment = async () => {
    try {
      const token = Cookies.get("token");
      let success = false;
      let response;
      
      try {
        response = await axios.delete(`/api/superadmin/departments/${selectedDepartmentId}/permanent`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        success = true;
      } catch (firstError) {
        console.warn("Error on superadmin permanent delete endpoint, trying fallback:", firstError.message);
        
        try {
          response = await axios.delete(`/api/admin/departments/${selectedDepartmentId}/permanent`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          success = true;
        } catch (secondError) {
          console.error("Error on admin permanent delete endpoint:", secondError.message);
          throw new Error("Failed to permanently delete department");
        }
      }
      setShowConfirmModal(false);
      toast.success("Department permanently deleted");
      fetchDeletedDepartments(); 
    } catch (error) {
      console.error("Error permanently deleting department:", error);
      let errorMessage = "Failed to permanently delete department.";
      
      if (error.response) {
        console.error("Response error data:", error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      }
      
      toast.error(errorMessage);
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    fetchDeletedDepartments();
    const existingTimer = localStorage.getItem('autoDeleteTimer');
    if (existingTimer) {
      setAutoDeleteEnabled(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading deleted departments...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Deleted Departments</h1>

      <button 
        onClick={() => router.push("/superadmin/departments")} 
        className="bg-[#01579B] text-white px-4 py-2 rounded mb-4"
      >
        Back
      </button>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4 mb-3">
          <h3 className="text-sm font-semibold text-black">Auto-Delete Settings:</h3>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-black">Delete after:</label>
            <select
              value={autoDeleteDays}
              onChange={(e) => setAutoDeleteDays(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={autoDeleteEnabled}
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
            </select>
          </div>
          
          {!autoDeleteEnabled ? (
            <button
              onClick={enableAutoDelete}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Enable Auto-Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
                Auto-delete enabled for {autoDeleteDays} days
              </div>
              <button
                onClick={disableAutoDelete}
                className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Disable
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <p>Loading deleted departments...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden text-black">
        <thead>
          <tr className="bg-[#01579B] text-white">
            <th className="p-3">Department Name</th>
            <th className="p-3">Type</th>
            <th className="p-3">Deleted Date</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDepartments.length > 0 ? (
            filteredDepartments.map((department) => (
              <tr key={department.id} className="text-center border-b">
                <td className="p-3">{department.department_name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    department.department_type === 'Academic' 
                      ? 'bg-blue-100 text-blue-800' 
                      : department.department_type === 'Administrative'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {department.department_type}
                  </span>
                </td>
                <td className="p-3">
                  {department.deleted_at ? new Date(department.deleted_at).toLocaleDateString() : 'Unknown'}
                </td>
                <td className="p-3 flex justify-center gap-2">
                  <button 
                    onClick={() => confirmPermanentDelete(department.id)} 
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center"
                    title="Permanently Delete Department"
                  >
                    <Trash className="w-4 h-4 mr-1" />
                    Delete Now
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="p-3 text-center">No deleted departments found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={permanentlyDeleteDepartment}
        title="Confirm Permanent Deletion"
        message="Are you sure you want to permanently delete this department? This action CANNOT be undone!"
        confirmText="Delete Permanently"
        cancelText="Cancel"
        type="danger"
        isLoading={false}
      />

      <ConfirmationModal
        isOpen={showAutoDeleteModal}
        onClose={() => setShowAutoDeleteModal(false)}
        onConfirm={confirmEnableAutoDelete}
        title="Enable Auto-Delete"
        message={`Are you sure you want to enable auto-deletion? All deleted departments will be permanently deleted after ${autoDeleteDays} days.`}
        confirmText="Enable Auto-Delete"
        cancelText="Cancel"
        type="warning"
        isLoading={false}
      />

      <ConfirmationModal
        isOpen={showDisableAutoDeleteModal}
        onClose={() => setShowDisableAutoDeleteModal(false)}
        onConfirm={confirmDisableAutoDelete}
        title="Disable Auto-Delete"
        message="Are you sure you want to disable auto-deletion? The auto-deletion timer will be cancelled."
        confirmText="Disable"
        cancelText="Cancel"
        type="info"
        isLoading={false}
      />
    </div>
  );
}