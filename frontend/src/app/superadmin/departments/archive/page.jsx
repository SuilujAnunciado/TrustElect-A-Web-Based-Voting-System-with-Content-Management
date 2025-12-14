"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

export default function ArchivedDepartmentsPage() {
  const router = useRouter();
  const [archivedDepartments, setArchivedDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);

  const fetchArchivedDepartments = async () => {
    setLoading(true);
    setError("");

    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
s
      let departmentsArray = [];
      let success = false;

      try {

        const res = await axios.get("/api/superadmin/departments/archived", {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        departmentsArray = res.data.departments || res.data || [];
        success = true;
      } catch (firstError) {
        console.warn("Error on superadmin archived endpoint, trying fallback:", firstError.message);
        
        try {
          const res = await axios.get("/api/admin/departments/archived", {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          });
          
          departmentsArray = res.data.departments || res.data || [];
          success = true;
        } catch (secondError) {
          console.error("Error on admin archived endpoint:", secondError.message);
          
          try {
            const res = await axios.get("/api/departments/archived", {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true
            });
            
            departmentsArray = res.data.departments || res.data || [];
            success = true;
          } catch (thirdError) {
            console.error("Error on generic archived endpoint:", thirdError.message);
            departmentsArray = [];
            success = true;
          }
        }
      }
      
      if (success) {
        setArchivedDepartments(departmentsArray);
      }
    } catch (error) {
      console.error("Error fetching archived departments:", error);
      setError("Failed to load archived departments. " + (error.response?.data?.message || error.message));
      setArchivedDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedDepartments();
  }, []);

  const handleRestore = async (id) => {
    setSelectedDepartmentId(id);
    setShowRestoreModal(true);
  };

  const confirmRestoreDepartment = async () => {
    try {
      const token = Cookies.get("token");

      let success = false;
      let response;
      
      try {
        response = await axios.patch(`/api/superadmin/departments/${selectedDepartmentId}/restore`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        success = true;
      } catch (firstError) {
        console.warn("Error on first restore endpoint, trying fallback:", firstError.message);
        
        try {
          response = await axios.patch(`/api/admin/departments/${selectedDepartmentId}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          success = true;
        } catch (secondError) {
          console.error("Error on admin endpoint:", secondError.message);

          try {
            response = await axios.patch(`/api/departments/${selectedDepartmentId}/restore`, {}, {
              headers: { Authorization: `Bearer ${token}` },
            });
            success = true;
          } catch (thirdError) {
            console.error("Error on generic endpoint:", thirdError.message);
            throw new Error("Failed to restore department. Please try again or contact support.");
          }
        }
      }
      
      toast.success(response.data.message || "Department restored successfully");
      setShowRestoreModal(false);
      fetchArchivedDepartments();
    } catch (error) {
      console.error("Error restoring department:", error);
      toast.error(error.response?.data?.message || "Failed to restore department");
    }
  };

  const handlePermanentDelete = async (id) => {
    setSelectedDepartmentId(id);
    setShowDeleteModal(true);
  };

  const confirmPermanentDeleteDepartment = async () => {
    try {
      const token = Cookies.get("token");

      let success = false;
      let response;
      
      try {
        response = await axios.delete(`/api/superadmin/departments/${selectedDepartmentId}/permanent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        success = true;
      } catch (firstError) {
        console.warn("Error on first permanent delete endpoint, trying fallback:", firstError.message);
        
        try {
          response = await axios.delete(`/api/admin/departments/${selectedDepartmentId}/permanent`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          success = true;
        } catch (secondError) {
          console.error("Error on admin endpoint:", secondError.message);
          
          try {
            response = await axios.delete(`/api/departments/${selectedDepartmentId}/permanent`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            success = true;
          } catch (thirdError) {
            console.error("Error on generic endpoint:", thirdError.message);
            throw new Error("Failed to permanently delete department. Please try again or contact support.");
          }
        }
      }
      
      toast.success(response.data.message || "Department permanently deleted");
      setShowDeleteModal(false);
      fetchArchivedDepartments();
    } catch (error) {
      console.error("Error permanently deleting department:", error);
      toast.error(error.response?.data?.message || "Failed to permanently delete department");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Archived Departments</h1>

      <button 
        onClick={() => router.push("/superadmin/departments")} 
        className="bg-[#01579B] text-white px-4 py-2 rounded mb-4"
      >
        Back
      </button>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {loading && <p>Loading archived departments...</p>}

      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden text-black">
        <thead>
          <tr className="bg-[#01579B] text-white">
            <th className="p-3">Department Name</th>
            <th className="p-3">Type</th>
            <th className="p-3">Archived Date</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {archivedDepartments.length > 0 ? (
            archivedDepartments.map((department) => (
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
                  {department.updated_at ? new Date(department.updated_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="p-3 flex justify-center gap-2">
                  <button
                    onClick={() => handleRestore(department.id)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(department.id)}
                    className="bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Permanently Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="p-3 text-center">No archived departments found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={confirmRestoreDepartment}
        title="Confirm Restore"
        message="Are you sure you want to restore this department? The department will be moved back to the active departments list."
        confirmText="Restore"
        cancelText="Cancel"
        type="info"
        isLoading={false}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmPermanentDeleteDepartment}
        title="Confirm Permanent Delete"
        message="Are you sure you want to permanently delete this department? This action cannot be undone and will permanently remove the department from the system."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        type="danger"
        isLoading={false}
      />
    </div>
  );
}