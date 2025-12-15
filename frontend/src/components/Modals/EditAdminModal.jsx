"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

export default function EditAdminModal({ admin, onClose, onSuccess }) {
<<<<<<< HEAD
=======
  // Get current user info to check if editing own profile
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const currentUserEmail = Cookies.get("email");
  const isEditingOwnProfile = currentUserEmail === admin.email;
  
  const [formData, setFormData] = useState({
    firstName: admin.first_name || "",
    lastName: admin.last_name || "",
    email: admin.email || "",
    employeeNumber: admin.employee_number || "",
    department: admin.department || "",
  });

<<<<<<< HEAD
=======
  // Clear any existing errors when component mounts
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  useEffect(() => {
    setErrors({});
  }, []);

<<<<<<< HEAD
  
=======
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

<<<<<<< HEAD
=======
  // Check if form has been modified
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const hasFormChanged = () => {
    const baseChanges = (
      formData.firstName !== (admin.first_name || "") ||
      formData.lastName !== (admin.last_name || "") ||
      formData.employeeNumber !== (admin.employee_number || "") ||
      formData.department !== (admin.department || "")
    );
    
<<<<<<< HEAD
=======
    // Only check email changes if not editing own profile
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const emailChanged = isEditingOwnProfile ? false : (formData.email !== (admin.email || ""));
    
    return baseChanges || emailChanged;
  };

<<<<<<< HEAD
=======
  // Fetch departments when component mounts
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get("/api/superadmin/department-names", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data && Array.isArray(res.data)) {
          setDepartments(res.data);
        } else {
          setDepartments([
            "Information and Communication Technology (ICT)",
            "Tourism and Hospitality Management (THM)",
            "Business Administration and Accountancy"
          ]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartments([
          "Information and Communication Technology (ICT)",
          "Tourism and Hospitality Management (THM)",
          "Business Administration and Accountancy"
        ]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [admin.id]);

<<<<<<< HEAD
  const checkEmailExists = async (email) => {
    if (!email || email === admin.email) return false; 
=======
  // Check if email already exists
  const checkEmailExists = async (email) => {
    if (!email || email === admin.email) return false; // Don't check if it's the same email
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    
    try {
      setCheckingEmail(true);
      const token = Cookies.get("token");
      const userRole = Cookies.get("role");
      
<<<<<<< HEAD
=======
      // Use the correct endpoint based on user role
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const endpoint = userRole === 'Super Admin' 
        ? `/api/superadmin/check-email?email=${encodeURIComponent(email)}`
        : `/api/admin/check-email?email=${encodeURIComponent(email)}`;
      
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.exists;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
<<<<<<< HEAD
=======
    // Prevent email changes when editing own profile
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (name === 'email' && isEditingOwnProfile) {
      return;
    }
    
<<<<<<< HEAD
    let processedValue = value;
    if (name === 'firstName' || name === 'lastName') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '').substring(0, 35);
    } else if (name === 'employeeNumber') {
=======
    // Apply character limits and validation
    let processedValue = value;
    if (name === 'firstName' || name === 'lastName') {
      // Only allow letters and spaces, max 35 characters
      processedValue = value.replace(/[^a-zA-Z\s]/g, '').substring(0, 35);
    } else if (name === 'employeeNumber') {
      // Only allow alphanumeric characters, max 8 characters
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      processedValue = value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    } else if (name === 'email') {
      processedValue = value.substring(0, 50);
    }
    
    setFormData({ ...formData, [name]: processedValue });
    
<<<<<<< HEAD
=======
    // Clear error for this field when user starts typing
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    
<<<<<<< HEAD
=======
    // Clear department error when department changes
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (name === 'department' && errors.department) {
      setErrors({ ...errors, department: "" });
    }
    
<<<<<<< HEAD
=======
    // Check email if it's an email field and has changed
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (name === 'email' && processedValue !== admin.email && !isEditingOwnProfile) {
      if (processedValue.endsWith("@novaliches.sti.edu.ph") || processedValue.endsWith("@novaliches.sti.edu")) {
        checkEmailExists(processedValue).then(exists => {
          if (exists) {
            setErrors(prev => ({ ...prev, email: "Email already exists. Please use a different email." }));
          }
        });
      }
    }
  };

  const validateInputs = async () => {
    let newErrors = {};
        
<<<<<<< HEAD
=======
    // First Name validation
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First Name is required.";
    } else if (!/^[A-Za-z\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = "First Name must contain letters only.";
    } else if (formData.firstName.trim().length < 1) {
      newErrors.firstName = "First Name is required.";
    } else if (formData.firstName.trim().length > 35) {
      newErrors.firstName = "First Name must not exceed 35 characters.";
    }
<<<<<<< HEAD

=======
    
    // Last Name validation
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last Name is required.";
    } else if (!/^[A-Za-z\s]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = "Last Name must contain letters only.";
    } else if (formData.lastName.trim().length < 1) {
      newErrors.lastName = "Last Name is required.";
    } else if (formData.lastName.trim().length > 35) {
      newErrors.lastName = "Last Name must not exceed 35 characters.";
    }
<<<<<<< HEAD

=======
    
    // Email validation (skip if editing own profile)
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (!isEditingOwnProfile) {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required.";
      } else if (!formData.email.endsWith("@novaliches.sti.edu.ph") && !formData.email.endsWith("@novaliches.sti.edu")) {
        newErrors.email = "Invalid STI email. Must end with @novaliches.sti.edu.ph or @novaliches.sti.edu";
      } else if (formData.email.length > 50) {
        newErrors.email = "Email must not exceed 50 characters.";
      } else if (formData.email !== admin.email) {
<<<<<<< HEAD
=======
        // Check if email already exists (only if it's different from current email)
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists) {
          newErrors.email = "Email already exists. Please use a different email.";
        }
      }
    }
<<<<<<< HEAD

=======
    
    // Employee Number validation
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (!formData.employeeNumber.trim()) {
      newErrors.employeeNumber = "Employee Number is required.";
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.employeeNumber)) {
      newErrors.employeeNumber = "Employee Number must contain only letters and numbers.";
    } else if (formData.employeeNumber.length < 3) {
      newErrors.employeeNumber = "Employee Number must be at least 3 characters.";
    } else if (formData.employeeNumber.length > 8) {
      newErrors.employeeNumber = "Employee Number must not exceed 8 characters.";
    }
<<<<<<< HEAD

    if (!formData.department) {
      newErrors.department = "Select a department.";
    }
=======
    
    // Department validation - ONLY check if department is selected
    if (!formData.department) {
      newErrors.department = "Select a department.";
    }
    // NO department restriction - multiple admins can be in the same department
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = await validateInputs();
    if (!isValid) return;
    
<<<<<<< HEAD
=======
    // Show confirmation modal instead of directly submitting
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    setShowSaveConfirm(true);
  };

  const confirmSaveChanges = async () => {
    setIsSubmitting(true);
    setShowSaveConfirm(false);

    try {
      const token = Cookies.get("token");
      const userRole = Cookies.get("role");
      
<<<<<<< HEAD
=======
      // Prepare data in the format expected by the API
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeNumber: formData.employeeNumber,
        department: formData.department
      };
      
<<<<<<< HEAD
=======
      // Only include email if not editing own profile
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (!isEditingOwnProfile) {
        updateData.email = formData.email;
      }

      
<<<<<<< HEAD
=======
      // Use the correct endpoint based on user role
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const endpoint = userRole === 'Super Admin' 
        ? `/api/superadmin/admins/${admin.id}`
        : `/api/admin/manage-admins/${admin.id}`;
      
      await axios.put(endpoint, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success(`${updateData.firstName} ${updateData.lastName} updated successfully!`);
      
<<<<<<< HEAD
=======
      // Call onSuccess callback if provided
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
<<<<<<< HEAD

      if (typeof window !== 'undefined') {

=======
      
      // Trigger a callback function instead of reloading the page
      if (typeof window !== 'undefined') {
        // Create an event to notify that an admin was updated
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        const event = new CustomEvent('admin-updated', { 
          detail: { 
            adminId: admin.id,
            updatedData: updateData
          } 
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error(error.response?.data?.message || "Failed to update admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelSaveChanges = () => {
    setShowSaveConfirm(false);
  };

  const handleCancel = () => {
<<<<<<< HEAD
=======
    // Check if form has been modified
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (hasFormChanged()) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    onClose();
  };

  const cancelCancel = () => {
    setShowCancelConfirm(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-110">
        <h2 className="text-xl font-bold mb-4 text-center text-black">Edit Admin</h2>
        
        <form className="space-y-3">
          <label className="text-black font-bold">First Name:</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            maxLength={35}
            placeholder="Enter first name (max 35 characters)"
            className="border w-full p-2 rounded text-black"
          />
          {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}

          <label className="text-black font-bold">Last Name:</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            maxLength={35}
            placeholder="Enter last name (max 35 characters)"
            className="border w-full p-2 rounded text-black"
          />
          {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}

          <label className="text-black font-bold">Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            maxLength={50}
            placeholder="Enter STI email (@novaliches.sti.edu.ph or @novaliches.sti.edu)"
            className={`border w-full p-2 rounded text-black ${isEditingOwnProfile ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            disabled={isEditingOwnProfile}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          {checkingEmail && <p className="text-blue-500 text-sm">Checking email availability...</p>}

          <label className="text-black font-bold">Employee Number:</label>
          <input
            type="text"
            name="employeeNumber"
            value={formData.employeeNumber}
            onChange={handleChange}
            maxLength={8}
            placeholder="Enter employee number (3-8 alphanumeric characters)"
            className="border w-full p-2 rounded text-black"
          />
          {errors.employeeNumber && <p className="text-red-500 text-sm">{errors.employeeNumber}</p>}

          <label className="text-black font-bold">Department:</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="border w-full p-2 rounded text-black"
            disabled={loadingDepartments}
          >
            {loadingDepartments ? (
              <option value="">Loading departments...</option>
            ) : (
              <>
                <option value=""></option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </>
            )}
          </select>
          {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
        </form>

        <div className="mt-6 flex justify-between">
          <button onClick={handleCancel} className="text-red-500" disabled={isSubmitting}>Cancel</button>
          <div className="space-x-2">
            <button 
              onClick={handleSubmit} 
              className={`${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'} text-white px-4 py-2 rounded flex items-center`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <p className="text-gray-700 mb-2">
            <strong>Note:</strong> To edit this admin's permissions, please use the Permissions button on the admin list.
          </p>
        </div>
      </div>

<<<<<<< HEAD
=======
      {/* Cancel Confirmation Modal */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      {showCancelConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Confirm Cancellation</h2>
            <p className="text-center text-gray-600 mb-6">
              Are you sure you want to cancel? All unsaved changes will be lost.
            </p>

            <div className="flex justify-center gap-4">
              <button 
                onClick={cancelCancel} 
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
              >
                No, Continue
              </button>

               <button 
                onClick={confirmCancel} 
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
=======
      {/* Save Confirmation Modal */}
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      {showSaveConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Confirm Save Changes</h2>
            <div className="mb-6">
              <p className="text-center text-black mb-2">
                Are you sure you want to save these changes?
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button 
                onClick={cancelSaveChanges} 
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
                disabled={isSubmitting}
              >
                No, Cancel
              </button>

              <button 
                onClick={confirmSaveChanges} 
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
                disabled={isSubmitting}
              >
                Yes, Save
              </button>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
