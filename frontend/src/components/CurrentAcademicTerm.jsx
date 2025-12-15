"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export default function CurrentAcademicTerm({ selectedTermId, studentCount }) {
  const [termInfo, setTermInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTermInfo = async () => {
    try {
      const token = Cookies.get("token");
<<<<<<< HEAD

=======
      
      // If a specific term is selected, fetch that term
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (selectedTermId) {
        const response = await axios.get(`/api/academic-terms/${selectedTermId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

<<<<<<< HEAD
        
=======
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        if (response.data.success) {
          setTermInfo(response.data.data);
        }
      } else {
<<<<<<< HEAD
=======
        // Otherwise fetch the current term
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        const response = await axios.get("/api/academic-terms/current", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (response.data.success) {
          setTermInfo(response.data.data);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching academic term:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTermInfo();
  }, [selectedTermId]);

  if (loading) {
    return (
      <p className="text-black font-bold mb-4">
        <span className="animate-pulse">Loading academic term...</span>
      </p>
    );
  }

  if (!termInfo) {
    return (
      <p className="text-red-600 font-bold mb-4">
        No current academic term set. Please contact an administrator.
      </p>
    );
  }

  return (
    <div className="mb-4">
      <p className="text-black font-bold">
        School Year: {termInfo.school_year} - {termInfo.term}
        {termInfo.is_current && <span className="ml-2 text-green-600 text-sm">(Current)</span>}
      </p>
      <p className="text-gray-600 text-sm">
        Total students in this term: {studentCount !== undefined ? studentCount : (termInfo.student_count || 0)}
      </p>
    </div>
  );
}

