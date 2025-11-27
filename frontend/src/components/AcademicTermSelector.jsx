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
      
      // Fetch all academic terms
      const response = await axios.get("/api/academic-terms", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (response.data.success) {
        setAcademicTerms(response.data.data);
        
        // Find current term
        const current = response.data.data.find(term => term.is_current);
        if (current) {
          setCurrentTerm(current);
          // If no term is selected, default to current term
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

  const formatTermDisplay = (term) => {
    return `${term.school_year} ${term.term} ${term.is_current ? '(Current)' : ''}`;
  };

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

