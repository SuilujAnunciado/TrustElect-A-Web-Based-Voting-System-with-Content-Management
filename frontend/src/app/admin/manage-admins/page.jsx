"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import AddAdminModal from "@/components/Modals/AddAdminModal";
import EditAdminModal from "@/components/Modals/EditAdminModal";
import ResetPasswordModal from "@/components/Modals/ResetPasswordModal";
import EditAdminPermissionsModal from "@/components/Modals/EditAdminPermissionsModal";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { toast } from "react-hot-toast";
import usePermissions from "@/hooks/usePermissions";

export default function ManageAdminsPage() {
  const router = useRouter();
  const { hasPermission, permissions, permissionsLoading } = usePermissions();
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [departmentFilter, setDepartmentFilter] = useState(""); 
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserDepartment, setCurrentUserDepartment] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Check if user has admin management permissions
  useEffect(() => {

    
    if (!permissionsLoading && !hasPermission('adminManagement', 'view')) {
      router.push('/admin');
      toast.error("You don't have permission to access Admin Management");
      return;
    }
  }, [hasPermission, router, permissionsLoading, permissions]);

  const fetchDepartments = async () => {
    try {
      const token = Cookies.get("token");
      const res = await axios.get("/api/admin/departments", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const departments = res.data.departments || res.data || [];
      setAvailableDepartments(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      // Fallback to hardcoded departments if API fails
      setAvailableDepartments([
        "Information and Communication Technology (ICT)",
        "Tourism and Hospitality Management (THM)",
        "Business Administration and Accountancy",
        "Administrator"
      ]);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = Cookies.get("token");
      const res = await axios.get("/api/admin/manage-admins", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const tokenData = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(tokenData.id);
      
      // Get department from token or fetch from API
      if (tokenData.department) {
        setCurrentUserDepartment(tokenData.department);
        console.log("🔍 Debug - Department from token:", tokenData.department);
      } else {
        // Fetch current user data to get department
        try {
          const userRes = await axios.get("/api/admin/profile", {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          if (userRes.data.department) {
            setCurrentUserDepartment(userRes.data.department);
            console.log("🔍 Debug - Department from API:", userRes.data.department);
          }
        } catch (error) {
          console.error("Error fetching user department:", error);
        }
      }
      
      console.log("🔍 Debug - Token data:", tokenData);

      const updatedAdmins = res.data.admins.map(admin => ({
        ...admin,
        department: admin.department === "Administration" ? "Administrator" : admin.department
      }));

      console.log("🔍 Debug - All admins from API:", updatedAdmins);
      console.log("🔍 Debug - Current user data:", tokenData);

      // Filter out system admins/root admins and only show active admins
      let filteredAdmins = updatedAdmins.filter((admin) => 
        admin.is_active && !isSuperAdmin(admin)
      );

      console.log("🔍 Debug - After basic filtering:", filteredAdmins);

      // Apply department-based visibility filtering
      filteredAdmins = applyDepartmentVisibilityFilter(filteredAdmins, tokenData);

      console.log("🔍 Debug - After department filtering:", filteredAdmins);

      // If no admins are shown after filtering, show all active admins as fallback
      if (filteredAdmins.length === 0) {
        console.log("🔍 Debug - No admins after filtering, showing all active admins as fallback");
        const fallbackAdmins = updatedAdmins.filter((admin) => admin.is_active && !isSuperAdmin(admin));
        setAdmins(fallbackAdmins);
        setFilteredAdmins(fallbackAdmins);
      } else {
        setAdmins(filteredAdmins);
        setFilteredAdmins(filteredAdmins);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      setError("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query === "") {
      setFilteredAdmins(admins);
    } else {
      setFilteredAdmins(
        admins.filter(
          (admin) =>
            admin.first_name.toLowerCase().includes(query.toLowerCase()) ||
            admin.last_name.toLowerCase().includes(query.toLowerCase()) ||
            admin.email.toLowerCase().includes(query.toLowerCase()) ||
            admin.employee_number?.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!hasPermission('adminManagement', 'delete')) {
      toast.error("You don't have permission to delete admins");
      return;
    }

    // Check if user is trying to delete themselves
    if (currentUserId && parseInt(currentUserId) === parseInt(adminId)) {
      toast.error("You cannot archive your own account.");
      return;
    }

    setSelectedAdminId(adminId);
    setShowArchiveModal(true);
  };

  const confirmArchiveAdmin = async () => {
    try {
      const token = Cookies.get("token");
      await axios.delete(`/api/admin/manage-admins/${selectedAdminId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      toast.success("Admin archived successfully");
      setShowArchiveModal(false);
      fetchAdmins();
    } catch (error) {
      console.error("Error archiving admin:", error);
      toast.error("Failed to archive admin");
    }
  };

  const handlePermanentDeleteAdmin = async (adminId) => {
    if (!hasPermission('adminManagement', 'delete')) {
      toast.error("You don't have permission to delete admins");
      return;
    }

    // Check if user is trying to delete themselves
    if (currentUserId && parseInt(currentUserId) === parseInt(adminId)) {
      toast.error("You cannot delete your own account.");
      return;
    }

    setSelectedAdminId(adminId);
    setShowDeleteModal(true);
  };

  const confirmPermanentDeleteAdmin = async () => {
    try {
      const token = Cookies.get("token");
      await axios.delete(`/api/admin/manage-admins/${selectedAdminId}?action=delete`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      toast.success("Admin moved to deleted folder");
      setShowDeleteModal(false);
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Failed to delete admin");
    }
  };

  const unlockAdminAccount = async (adminId) => {
    if (!hasPermission('adminManagement', 'edit')) {
      toast.error("You don't have permission to unlock admin accounts");
      return;
    }

    try {
      const token = Cookies.get("token");
      await axios.patch(
        `/api/admin/manage-admins/${adminId}/unlock`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      toast.success("Admin account unlocked successfully");
      fetchAdmins();
    } catch (error) {
      console.error("Error unlocking admin account:", error);
      toast.error("Failed to unlock admin account");
    }
  };

  const handleDepartmentFilter = (e) => {
    const department = e.target.value;
    setDepartmentFilter(department);

    if (department === "") {
      setFilteredAdmins(admins);
    } else {
      setFilteredAdmins(admins.filter((admin) => admin.department === department));
    }
  };

  // Get departments that the current user can see admins from
  const getVisibleDepartments = () => {
    // If no department or Administrator/Administration/System, show all departments
    if (!currentUserDepartment || 
        currentUserDepartment === "Administrator" || 
        currentUserDepartment === "Administration" || 
        currentUserDepartment === "System") {
      return availableDepartments;
    }
    
    // For academic/organization department users, only show their own department
    return availableDepartments.filter(dept => {
      const deptName = dept.department_name || dept;
      return deptName === currentUserDepartment;
    });
  };
  
  useEffect(() => {
    fetchAdmins();
    fetchDepartments();
  }, [refreshTrigger]);

  const isSuperAdmin = (admin) => {
    const isSuper = admin.role_id === 1 || (admin.department === "Administrator" && !admin.employee_number);
    console.log(`🔍 Debug - isSuperAdmin check for ${admin.first_name} ${admin.last_name}:`, {
      role_id: admin.role_id,
      department: admin.department,
      employee_number: admin.employee_number,
      isSuper
    });
    return isSuper;
  };

  const isCurrentUser = (admin) => {
    return admin.id === currentUserId;
  };

  // Apply department-based visibility filtering
  const applyDepartmentVisibilityFilter = (admins, currentUser) => {
    const currentUserDept = currentUser.department;
    const currentUserId = currentUser.id;
    const currentUserRole = currentUser.role_id;

    console.log("🔍 Debug - Filtering with:", { currentUserDept, currentUserId, currentUserRole });
    console.log("🔍 Debug - Admins to filter:", admins.map(a => ({ 
      id: a.id, 
      name: `${a.first_name} ${a.last_name}`, 
      dept: a.department, 
      created_by: a.created_by 
    })));

    // If current user is Administrator/Administration/System (role_id 1 or department check), they can see all admins
    if (currentUserRole === 1 || currentUserDept === "Administrator" || currentUserDept === "Administration" || currentUserDept === "System") {
      console.log("🔍 Debug - User is Administrator/System, showing all admins");
      return admins;
    }

    // If current user department is undefined or null, show all admins as fallback
    if (!currentUserDept) {
      console.log("🔍 Debug - User department is undefined, showing all admins as fallback");
      return admins;
    }

    // For academic/organization department users, only show admins from their department
    const filtered = admins.filter(admin => {
      // Only show admins from the same department
      if (admin.department === currentUserDept) {
        console.log(`🔍 Debug - Showing admin ${admin.first_name} ${admin.last_name} - same department (${admin.department})`);
        return true;
      }

      // Hide Administrator/Administration/System department admins
      if (admin.department === "Administrator" || admin.department === "Administration" || admin.department === "System") {
        console.log(`🔍 Debug - Hiding admin ${admin.first_name} ${admin.last_name} - Administrator/System department`);
        return false;
      }

      // Hide admins from other departments
      console.log(`🔍 Debug - Hiding admin ${admin.first_name} ${admin.last_name} - different department (${admin.department} vs ${currentUserDept})`);
      return false;
    });

    console.log("🔍 Debug - Final filtered admins:", filtered.length);
    return filtered;
  };

  const handleManagePermissions = (admin) => {
    if (!hasPermission('adminManagement', 'edit')) {
      toast.error("You don't have permission to manage admin permissions");
      return;
    }

    // Check if user is trying to edit their own permissions
    if (currentUserId && parseInt(currentUserId) === parseInt(admin.id)) {
      toast.error("You cannot edit your own permissions.");
      return;
    }

    setSelectedAdmin(admin);
    setShowPermissionsModal(true);
  };

  const handleEditAdmin = (admin) => {
    if (!hasPermission('adminManagement', 'edit')) {
      toast.error("You don't have permission to edit admins");
      return;
    }
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  const handleResetPassword = (admin) => {
    if (!hasPermission('adminManagement', 'edit')) {
      toast.error("You don't have permission to reset admin passwords");
      return;
    }
    setSelectedAdmin(admin);
    setShowResetModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admins...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-black">Admin Management</h1>

      <div className="flex gap-4 mb-4 text-black">
        {/*Search Bar */}
        <input
          type="text"
          placeholder="Search here"
          value={searchQuery}
          onChange={handleSearch}
          className="border p-2 rounded w-100"
        />
  
        <select
          value={departmentFilter}
          onChange={handleDepartmentFilter}
          className="border p-2 rounded w-50 text-black"
        >
          <option value="">All Departments</option>
          {getVisibleDepartments().map((dept) => (
            <option key={dept.department_name || dept} value={dept.department_name || dept}>
              {dept.department_name || dept}
            </option>
          ))}
        </select>
      </div>


      {loading && <p>Loading admins...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex gap-4 mb-4">
        {hasPermission('adminManagement', 'create') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#01579B] text-white px-4 py-2 rounded"
          >
            Add New Admin
          </button>
        )}
        
        <button
          onClick={() => router.push("/admin/manage-admins/archive")}
          className="bg-gray-600 text-white px-4 py-2 rounded"
          title="View Archived Folder"
        >
          Archived Folder
        </button>
        
        <button
          onClick={() => router.push("/admin/manage-admins/delete")}
          className="bg-red-600 text-white px-4 py-2 rounded"
          title="View Deleted Folder"
        >
          Deleted Folder
        </button>
      </div>

      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden text-black">
        <thead>
          <tr className="bg-[#01579B] text-white">
            <th className="p-3">Full Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Employee #</th>
            <th className="p-3">Department</th>
            <th className="p-3">Role</th>
            <th className="p-3">Active Status</th>
            <th className="p-3">Account Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAdmins.map((admin) => (
            <tr key={admin.id} className="text-center border-b">
              <td className="p-3">{`${admin.first_name} ${admin.last_name}`}</td>
              <td className="p-3">{admin.email}</td>
              <td className="p-3">{admin.employee_number || '-'}</td>
              <td className="p-3">{admin.department}</td>
              <td className="p-3">
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Admin
                </span>
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {admin.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  admin.is_locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {admin.is_locked ? 'Locked' : 'Active'}
                </span>
                {admin.is_locked && admin.locked_until && (
                  <div className="text-xs text-gray-500">
                    Until: {new Date(admin.locked_until).toLocaleString()}
                  </div>
                )}
              </td>
              <td className="p-2">
                <div className="flex flex-wrap justify-center gap-1 min-w-[280px]">
                  {hasPermission('adminManagement', 'edit') && (
                    <button
                      onClick={() => handleEditAdmin(admin)}
                      className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs whitespace-nowrap"
                    >
                      Edit
                    </button>
                  )}
                  {hasPermission('adminManagement', 'edit') && !isCurrentUser(admin) && (
                    <button
                      onClick={() => handleManagePermissions(admin)}
                      className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-xs whitespace-nowrap"
                    >
                      Perms
                    </button>
                  )}
                  {hasPermission('adminManagement', 'delete') && !isCurrentUser(admin) && (
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="bg-yellow-500 text-white px-1.5 py-0.5 rounded text-xs whitespace-nowrap"
                      title="Move to Archived Folder"
                    >
                      Archive
                    </button>
                  )}
                  {hasPermission('adminManagement', 'delete') && !isCurrentUser(admin) && (
                    <button
                      onClick={() => handlePermanentDeleteAdmin(admin.id)}
                      className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs whitespace-nowrap"
                      title="Move to Deleted Folder"
                    >
                      Delete
                    </button>
                  )}
                  {hasPermission('adminManagement', 'edit') && (
                    <button
                      onClick={() => handleResetPassword(admin)}
                      className="bg-[#01579B] text-white px-1.5 py-0.5 rounded text-xs whitespace-nowrap"
                    >
                      Reset PW
                    </button>
                  )}
                  {admin.is_locked && hasPermission('adminManagement', 'edit') && (
                    <button 
                      onClick={() => unlockAdminAccount(admin.id)} 
                      className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs whitespace-nowrap"
                    >
                      Unlock
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modals */}
      {showAddModal && (
        <AddAdminModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {showEditModal && selectedAdmin && (
        <EditAdminModal
          admin={selectedAdmin}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdmin(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedAdmin(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {showResetModal && selectedAdmin && (
        <ResetPasswordModal
          admin={selectedAdmin}
          onClose={() => {
            setShowResetModal(false);
            setSelectedAdmin(null);
          }}
          onSuccess={() => {
            setShowResetModal(false);
            setSelectedAdmin(null);
          }}
        />
      )}

      {showPermissionsModal && selectedAdmin && (
        <EditAdminPermissionsModal
          admin={selectedAdmin}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedAdmin(null);
          }}
          onSave={(updatedPermissions) => {
            // Force permission update for the target admin
            try {
              // Store a timestamp in localStorage to indicate when the permissions were last updated
              const updateTimestamp = Date.now().toString();
              localStorage.setItem(`admin_permissions_updated_${selectedAdmin.id}`, updateTimestamp);
              
              // Dispatch a custom event to notify any component that might be using this admin's permissions
              const permissionUpdateEvent = new CustomEvent('admin-permissions-updated', {
                detail: { 
                  adminId: selectedAdmin.id,
                  timestamp: updateTimestamp,
                  permissions: updatedPermissions // Include the permissions that were saved
                }
              });
              window.dispatchEvent(permissionUpdateEvent);
              
              // Create a global timestamp update as well
              if (typeof window !== 'undefined' && window.GLOBAL_PERMISSIONS_TIMESTAMP) {
                window.GLOBAL_PERMISSIONS_TIMESTAMP = Date.now();
              }
              
              toast.success(`Permissions updated for ${selectedAdmin.first_name} ${selectedAdmin.last_name}`);
            } catch (e) {
              console.warn('Could not store permission update timestamp:', e);
            }
            
            setShowPermissionsModal(false);
            setSelectedAdmin(null);
            fetchAdmins(); // Refresh admin list after permission update
          }}
        />
      )}

      <ConfirmationModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={confirmArchiveAdmin}
        title="Confirm Archive"
        message="Are you sure you want to archive this admin? The admin will be moved to the archived folder."
        confirmText="Archive"
        cancelText="Cancel"
        type="warning"
        isLoading={false}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmPermanentDeleteAdmin}
        title="Confirm Delete"
        message="Are you sure you want to delete this admin? The admin will be moved to the deleted folder."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={false}
      />
      </div>
    </div>
  );
}
