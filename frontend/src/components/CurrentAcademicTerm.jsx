"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export default function CurrentAcademicTerm() {
  const [currentTerm, setCurrentTerm] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentTerm = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get("/api/academic-terms/current", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (response.data.success) {
        setCurrentTerm(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching current academic term:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTerm();
  }, []);

  if (loading) {
    return (
      <p className="text-black font-bold mb-4">
        <span className="animate-pulse">Loading academic term...</span>
      </p>
    );
  }

  if (!currentTerm) {
    return (
      <p className="text-red-600 font-bold mb-4">
        No current academic term set. Please contact an administrator.
      </p>
    );
  }

  return (
    <div className="mb-4">
      <p className="text-black font-bold">
        School Year: {currentTerm.school_year} - {currentTerm.term}
      </p>
      {currentTerm.student_count !== undefined && (
        <p className="text-gray-600 text-sm">
          Total students in this term: {currentTerm.student_count}
        </p>
      )}
    </div>
  );
}

