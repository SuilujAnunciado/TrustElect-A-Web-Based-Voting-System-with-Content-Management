"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

export default function AcademicTermSelector({ selectedTermId, onTermChange, showLabel = true }) {
  const [academicTerms, setAcademicTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAcademicTerms = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
<<<<<<< HEAD

      
=======
      
      // Fetch all academic terms
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const response = await axios.get("/api/academic-terms", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (response.data.success) {
        setAcademicTerms(response.data.data);
<<<<<<< HEAD

        const current = response.data.data.find(term => term.is_current);
        if (current) {
          setCurrentTerm(current);
=======
        
        // Find current term
        const current = response.data.data.find(term => term.is_current);
        if (current) {
          setCurrentTerm(current);
          // If no term is selected, default to current term
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
          if (!selectedTermId) {
            onTermChange(current.id);
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching academic terms:", error);
      toast.error("Failed to load academic terms");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicTerms();
  }, []);

<<<<<<< HEAD
=======
  // Make sure to update parent when current term is loaded
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  useEffect(() => {
    if (currentTerm && !selectedTermId) {
      onTermChange(currentTerm.id);
    }
  }, [currentTerm]);

  const formatTermDisplay = (term) => {
    const currentLabel = term.is_current ? '(Current)' : '';
    return `${term.school_year} ${term.term} ${currentLabel}`.trim();
  };

<<<<<<< HEAD
=======
  // Allow parent to trigger refresh
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  window.refreshAcademicTerms = fetchAcademicTerms;

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-gray-600 text-sm">Loading terms...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <label className="text-gray-700 font-medium text-sm">
          Academic Term:
        </label>
      )}
      <select
        value={selectedTermId || ''}
        onChange={(e) => onTermChange(e.target.value ? parseInt(e.target.value) : null)}
        className="border p-2 rounded text-black bg-white min-w-[250px]"
      >
        {academicTerms.length === 0 ? (
          <option value="">No academic terms available</option>
        ) : (
          <>
            <option value="">All Terms</option>
            {academicTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {formatTermDisplay(term)} 
                {term.student_count !== undefined && ` - ${term.student_count} students`}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
}

