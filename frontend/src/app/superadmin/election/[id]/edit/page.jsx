"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, AlertCircle, CheckCircle, InfoIcon } from 'lucide-react';
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';


export default function EditElectionPage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.id;

  const [loading, setLoading] = useState({
    initial: true,
    saving: false,
    eligibility: false
  });
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [originalElectionData, setOriginalElectionData] = useState(null);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [electionData, setElectionData] = useState({
    title: "",
    description: "",
    election_type: "",
    date_from: "",
    date_to: "",
    start_time: "",
    end_time: "",
    status: "",
    eligibleVoters: {
      programs: [],
      yearLevels: [],
      semester: [],
      gender: [],
      precinct: [],
      precinctPrograms: {}
    }
  });
  const [maintenanceData, setMaintenanceData] = useState({
    programs: [],
    electionTypes: [],
    yearLevels: [],
    genders: [],
    semesters: [],
    precincts: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [criteriaErrors, setCriteriaErrors] = useState({});
  const [eligibleCount, setEligibleCount] = useState(0);
  const [visibleProgramSelections, setVisibleProgramSelections] = useState({});

  const sortPrecincts = (a, b) => {
    const extractNumber = (str) => parseInt(str.match(/\d+/)?.[0] || '0');
    const aNum = extractNumber(a);
    const bNum = extractNumber(b);
    if (aNum !== 0 && bNum !== 0) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  };

  const sortPrograms = (a, b) => {
    const collegePrograms = [
      'BSA', 'BSBAOM', 'BSCPE', 'BSCS', 'BSHM', 'BSIT', 'BMMA', 'BSTM'
    ];
    const seniorHighPrograms = [
      'ABM', 'CUART', 'DIGAR', 'HUMMS', 'MAWD', 'STEM', 'TOPER'
    ];

    const aType = seniorHighPrograms.includes(a) ? 'seniorHigh' : 'college';
    const bType = seniorHighPrograms.includes(b) ? 'seniorHigh' : 'college';

    if (aType !== bType) {
      return aType === 'college' ? -1 : 1;
    }

    if (aType === 'college') {
      if (collegePrograms.includes(a) && collegePrograms.includes(b)) {
        return collegePrograms.indexOf(a) - collegePrograms.indexOf(b);
      }
      return a.localeCompare(b);
    }

    if (seniorHighPrograms.includes(a) && seniorHighPrograms.includes(b)) {
      return seniorHighPrograms.indexOf(a) - seniorHighPrograms.indexOf(b);
    }
    return a.localeCompare(b);
  };

  const areAllSelected = (selectedItems, allItems) => {
    return selectedItems.length === allItems.length;
  };

  const toggleProgramSelection = (precinct) => {
    setVisibleProgramSelections(prev => ({
      ...prev,
      [precinct]: !prev[precinct]
    }));
  };

  const handlePrecinctProgramChange = (precinct, program) => {
    setElectionData(prev => {
      const precinctPrograms = { ...prev.eligibleVoters.precinctPrograms };
      
      if (!precinctPrograms[precinct]) {
        precinctPrograms[precinct] = [];
      }
      
      if (precinctPrograms[precinct].includes(program)) {
        precinctPrograms[precinct] = precinctPrograms[precinct].filter(p => p !== program);
      } else {
        precinctPrograms[precinct] = [...precinctPrograms[precinct], program];
      }
 
      if (precinctPrograms[precinct].length === 0) {
        delete precinctPrograms[precinct];
      }
      
      return {
        ...prev,
        eligibleVoters: {
          ...prev.eligibleVoters,
          precinctPrograms
        }
      };
    });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    
    try {
   
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "";
    }
  };

  const formatTimeForInput = (timeString) => {
    if (!timeString) return "";
    
    try {
  
      if (timeString.includes('T')) {
      
        timeString = timeString.split('T')[1];
      }

      if (timeString.split(':').length > 2) {
      
        return timeString.substring(0, 5);
      }

      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }

      const date = new Date(`2000-01-01T${timeString}`);
      if (!isNaN(date.getTime())) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
      
      return "";
    } catch (error) {
      console.error("Error formatting time:", error, timeString);
      return "";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, initial: true }));

        const token = Cookies.get("token");
        const electionResponse = await axios.get(
          `${API_BASE}/elections/${electionId}/details`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!electionResponse.data.success) {
          throw new Error(electionResponse.data.message || "Failed to load election");
        }

        const election = electionResponse.data.election;

        let eligibilityResponse;
        try {
          eligibilityResponse = await axios.get(
            `${API_BASE}/elections/${electionId}/criteria`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
        } catch (err) {
          console.error("Error fetching eligibility criteria:", err);
        }

        const criteria = eligibilityResponse?.data?.criteria || eligibilityResponse?.data || {};

        const eligibleVoters = {
          programs: criteria.courses || criteria.programs || [],
          yearLevels: criteria.year_levels || criteria.yearLevels || [],
          gender: criteria.genders || criteria.gender || [],
          semester: criteria.semesters || criteria.semester || [],
          precinct: criteria.precincts || criteria.precinct || [],
          precinctPrograms: criteria.precinctPrograms || criteria.precinct_programs || {}
        };

        const formattedDateFrom = formatDateForInput(election.date_from);
        const formattedDateTo = formatDateForInput(election.date_to);
        const formattedStartTime = formatTimeForInput(election.start_time);
        const formattedEndTime = formatTimeForInput(election.end_time);

        const formattedElectionData = {
          title: election.title,
          description: election.description || "",
          election_type: election.election_type,
          date_from: formattedDateFrom,
          date_to: formattedDateTo,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          status: election.status,
          eligibleVoters
        };

        setElectionData(formattedElectionData);

        setOriginalElectionData(formattedElectionData);

        try {
          const currentSemesterResponse = await axios.get(
            `${API_BASE}/maintenance/current-semester`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (currentSemesterResponse.data.success) {
            setCurrentSemester(currentSemesterResponse.data.semester);
          }
        } catch (err) {
          console.error("Error fetching current semester:", err);
          try {
            const storedSemester = localStorage.getItem('currentSemester');
            if (storedSemester) {
              setCurrentSemester(JSON.parse(storedSemester));
            }
          } catch (e) {
            console.error("Error getting semester from localStorage:", e);
          }
        }

        const endpoints = [
          { key: 'programs', url: 'programs' },
          { key: 'electionTypes', url: 'election-types' },
          { key: 'yearLevels', url: 'year-levels' },
          { key: 'genders', url: 'genders' },
          { key: 'semesters', url: 'semesters' },
          { key: 'precincts', url: 'precincts' }
        ];

        const requests = endpoints.map(endpoint => 
          axios.get(`${API_BASE}/maintenance/${endpoint.url}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );

        const responses = await Promise.all(requests);
        
        const data = endpoints.reduce((acc, endpoint, index) => {
          if (endpoint.key === 'precincts') {
         
            acc[endpoint.key] = responses[index].data.data;
          } else {
            acc[endpoint.key] = responses[index].data.data.map(item => item.name);
          }
          return acc;
        }, {});

        setMaintenanceData(data);

        if (criteria.precinctPrograms && Object.keys(criteria.precinctPrograms).length > 0) {
       
          setElectionData(prev => ({
            ...prev,
            eligibleVoters: {
              ...prev.eligibleVoters,
              precinctPrograms: criteria.precinctPrograms
            }
          }));
        }

        fetchEligibleCount(eligibleVoters);
        
      } catch (err) {
        console.error("Error loading election data:", err);
        setError(err.message || "Failed to load election details");
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    if (electionId) {
      fetchData();
    }
  }, [electionId]);

  useEffect(() => {
    const hasFilters = Object.values(electionData.eligibleVoters).some(arr => arr.length > 0);
    if (hasFilters) {
      fetchEligibleCount(electionData.eligibleVoters);
    } else {
      setEligibleCount(0);
    }
  }, [electionData.eligibleVoters]);

  const fetchEligibleCount = async (eligibleVoters) => {
    try {
      setLoading(prev => ({ ...prev, eligibility: true }));
      const token = Cookies.get("token");

      const allProgramsSelected = areAllSelected(eligibleVoters.programs, maintenanceData.programs);
      const allYearLevelsSelected = areAllSelected(eligibleVoters.yearLevels, maintenanceData.yearLevels);
      const allGendersSelected = areAllSelected(eligibleVoters.gender, maintenanceData.genders);

      const optimizedEligibleVoters = {
        programs: allProgramsSelected ? [] : eligibleVoters.programs,
        yearLevels: allYearLevelsSelected ? [] : eligibleVoters.yearLevels,
        gender: allGendersSelected ? [] : eligibleVoters.gender,
        semester: eligibleVoters.semester,
        precinct: eligibleVoters.precinct,
      };
      
      const response = await axios.post(
        `${API_BASE}/elections/preview-voters`,
        { eligible_voters: optimizedEligibleVoters },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setEligibleCount(response.data.count);
    } catch (error) {
      console.error("Error fetching eligible count:", error);
      toast.error("Couldn't update eligible voters count");
    } finally {
      setLoading(prev => ({ ...prev, eligibility: false }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!electionData.title) errors.title = "Title is required";
    if (!electionData.date_from) errors.date_from = "Start date is required";
    if (!electionData.date_to) errors.date_to = "End date is required";

    if (electionData.status === 'ongoing') {

      const now = new Date();
      const endDateTime = new Date(`${electionData.date_to}T${electionData.end_time || '23:59'}`);
      
      if (endDateTime < now) {
        errors.end_time = "The combined end date and time must be in the future";
      }
    } else {
      const startDateTime = new Date(`${electionData.date_from}T${electionData.start_time || '00:00'}`);
      const endDateTime = new Date(`${electionData.date_to}T${electionData.end_time || '23:59'}`);
      
      if (startDateTime > endDateTime) {
        errors.date_to = "End date/time must be after start date/time";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateVoterCriteria = () => {
    const newCriteriaErrors = {};
    const { eligibleVoters } = electionData;
    
    if (eligibleVoters.programs.length === 0) newCriteriaErrors.programs = "Select at least one program";
    if (eligibleVoters.yearLevels.length === 0) newCriteriaErrors.yearLevels = "Select at least one year level";
    if (eligibleVoters.gender.length === 0) newCriteriaErrors.gender = "Select at least one gender";
    if (eligibleVoters.precinct.length === 0) newCriteriaErrors.precinct = "Select at least one precinct";

    eligibleVoters.precinct.forEach(precinct => {
      if (!eligibleVoters.precinctPrograms[precinct]?.length) {
        newCriteriaErrors.precinct = `Assign at least one program to ${precinct}`;
      }
    });
    
    
    setCriteriaErrors(newCriteriaErrors);
    return Object.keys(newCriteriaErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setElectionData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (category, value) => {
    if (category === 'semester') return;
    
    setElectionData(prev => {
      if (category === 'precinct') {
        const currentValues = prev.eligibleVoters[category];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(item => item !== value)
          : [...currentValues, value];
        
        const precinctPrograms = { ...prev.eligibleVoters.precinctPrograms };
        if (!currentValues.includes(value)) {
          if (!precinctPrograms[value]) {
            precinctPrograms[value] = [];
          }
        } else {

          delete precinctPrograms[value];
        }
        
        return {
          ...prev,
          eligibleVoters: {
            ...prev.eligibleVoters,
            [category]: newValues,
            precinctPrograms
          }
        };
      }

      const currentValues = prev.eligibleVoters[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        eligibleVoters: {
          ...prev.eligibleVoters,
          [category]: newValues
        }
      };
    });

    if (criteriaErrors[category]) {
      setCriteriaErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[category];
        return newErrors;
      });
    }
  };

  const toggleAll = (category, items) => {
    if (category === 'semester') return;
    
    setElectionData(prev => {
      const currentValues = prev.eligibleVoters[category];
      const allSelected = currentValues.length === items.length;
      
      if (category === 'precinct') {
        const precinctPrograms = { ...prev.eligibleVoters.precinctPrograms };
        
        if (allSelected) {
          Object.keys(precinctPrograms).forEach(precinct => {
            delete precinctPrograms[precinct];
          });
        } else {
         
          items.forEach(precinct => {
            if (!precinctPrograms[precinct]) {
              precinctPrograms[precinct] = [];
            }
          });
        }
        
        return {
          ...prev,
          eligibleVoters: {
            ...prev.eligibleVoters,
            [category]: allSelected ? [] : [...items],
            precinctPrograms
          }
        };
      }
      
      return {
        ...prev,
        eligibleVoters: {
          ...prev.eligibleVoters,
          [category]: allSelected ? [] : [...items]
        }
      };
    });
    
    if (criteriaErrors[category]) {
      setCriteriaErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[category];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !validateVoterCriteria()) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      setSuccess(false);
      
      const token = Cookies.get("token");
      

      const currentElectionResponse = await axios.get(
        `${API_BASE}/elections/${electionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const currentElection = currentElectionResponse.data;
    
      const updatePayload = {
        title: electionData.title,
        description: electionData.description,
        election_type: electionData.election_type,
        end_time: electionData.end_time,
        date_to: electionData.date_to
      };

      if (electionData.status !== 'ongoing') {
        updatePayload.date_from = electionData.date_from;
        updatePayload.start_time = electionData.start_time;
      }

      const updateResponse = await axios.put(
        `${API_BASE}/elections/${electionId}`,
        updatePayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const allProgramsSelected = areAllSelected(electionData.eligibleVoters.programs, maintenanceData.programs);
      const allYearLevelsSelected = areAllSelected(electionData.eligibleVoters.yearLevels, maintenanceData.yearLevels);
      const allGendersSelected = areAllSelected(electionData.eligibleVoters.gender, maintenanceData.genders);
      
      const optimizedEligibleVoters = {
        programs: allProgramsSelected ? [] : electionData.eligibleVoters.programs,
        yearLevels: allYearLevelsSelected ? [] : electionData.eligibleVoters.yearLevels,
        gender: allGendersSelected ? [] : electionData.eligibleVoters.gender,
        semester: electionData.eligibleVoters.semester,
        precinct: electionData.eligibleVoters.precinct,
        precinctPrograms: electionData.eligibleVoters.precinctPrograms
      };

      const eligibilityResponse = await axios.put(
        `${API_BASE}/elections/${electionId}/criteria`,
        {
          eligibility: optimizedEligibleVoters
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setSuccess(true);
      toast.success('Election updated successfully!');

      setTimeout(() => {
        router.push(`/superadmin/election/${electionId}`);
      }, 1500);
      
    } catch (err) {
      console.error("Failed to update election:", err);
      setError(err.response?.data?.message || err.message || "Update failed");
      toast.error(`Failed to update election: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDiscardChanges = () => {
    if (originalElectionData) {
      setElectionData(originalElectionData);
      setFormErrors({});
      setCriteriaErrors({});
      toast.success('Changes discarded successfully');
    }
  };

  if (loading.initial) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-6xl mx-auto">
      <button 
        onClick={() => setShowBackConfirm(true)} 
        className="flex items-center text-blue-900 hover:text-blue-700 mb-4"
      >
        <ArrowLeft className="w-6 h-6 mr-2" />
        <span className="font-semibold">Back</span>
      </button>

      {showBackConfirm && (
        <div className="fixed inset-0  flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ">
         
            <p className="text-black  mb-6">Are you sure you want to go back? Any unsaved changes will be lost.</p>
            <div className="flex justify-end space-x-4 ">
              <button
                onClick={() => setShowBackConfirm(false)}
                className="px-4 py-2 text-black hover:text-gray-800 bg-gray-200 font-medium cursor-pointer"
              >
                No
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 text-black">Edit Election</h1>
      
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Cannot Edit Election</p>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">Election Updated</p>
            <p className="text-green-700">Election details have been updated successfully.</p>
          </div>
        </div>
      )}

      {!error && (
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <InfoIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Super Admin Access:</strong> You have full permission to edit any election regardless of who created it or its current status.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Election Details */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-black mb-1">Election Title</label>
                <input
                  type="text"
                  name="title"
                  value={electionData.title}
                  onChange={handleChange}
                  className={`border w-full p-2 rounded ${formErrors.title ? 'border-red-500' : 'border-gray-300'} text-black`}
                  placeholder="Student Council Election"
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Election Type</label>
                <select
                  name="election_type"
                  value={electionData.election_type}
                  onChange={handleChange}
                  className="border w-full p-2 rounded border-gray-300 text-black"
                >
                  {maintenanceData.electionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-black mb-1">Description</label>
                <textarea
                  name="description"
                  value={electionData.description}
                  onChange={handleChange}
                  className="border w-full p-2 rounded border-gray-300 text-black"
                  rows={3}
                  placeholder="Election description and purpose"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-black mb-1">Start Date</label>
                  <input
                    type="date"
                    name="date_from"
                    value={electionData.date_from}
                    onChange={handleChange}
                    min={electionData.status === 'ongoing' ? undefined : new Date().toISOString().split('T')[0]}
                    className={`border w-full p-2 rounded ${formErrors.date_from ? 'border-red-500' : 'border-gray-300'} text-black ${electionData.status === 'ongoing' || electionData.status === 'completed' ? 'bg-gray-100' : ''}`}
                    disabled={electionData.status === 'ongoing' || electionData.status === 'completed'}
                  />
                  {formErrors.date_from && <p className="text-red-500 text-sm mt-1">{formErrors.date_from}</p>}
                  
                </div>
                <div>
                  <label className="block font-medium text-black mb-1">End Date</label>
                  <input
                    type="date"
                    name="date_to"
                    value={electionData.date_to}
                    onChange={handleChange}
                    min={electionData.date_from || new Date().toISOString().split('T')[0]}
                    className={`border w-full p-2 rounded ${formErrors.date_to ? 'border-red-500' : 'border-gray-300'} text-black`}
                  />
                  {formErrors.date_to && <p className="text-red-500 text-sm mt-1">{formErrors.date_to}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-black mb-1">Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={electionData.start_time}
                    onChange={handleChange}
                    className={`border w-full p-2 rounded border-gray-300 text-black ${(electionData.status === 'ongoing' || electionData.status === 'completed') ? 'bg-gray-100' : ''}`}
                    disabled={electionData.status === 'ongoing' || electionData.status === 'completed'}
                  />
                
                </div>
                <div>
                  <label className="block font-medium text-black mb-1">
                    End Time
                    
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={electionData.end_time}
                    onChange={handleChange}
                    className={`border w-full p-2 rounded ${formErrors.end_time ? 'border-red-500' : 'border-gray-300'} text-black ${electionData.status === 'ongoing' ? 'ring-1 ring-blue-300' : ''}`}
                  />
                  {formErrors.end_time && <p className="text-red-500 text-sm mt-1">{formErrors.end_time}</p>}
                </div>
              </div>
              
            </div>

            {/* Eligible Voters */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-black mb-4">Eligible Voters</h2>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="font-medium text-blue-800">
                    {loading.eligibility ? 'Calculating...' : `${Number(eligibleCount).toLocaleString()} eligible voters count`}
                  </p>
                </div>

                {/* Programs */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-black">Programs</h3>
                    <button
                      type="button"
                      onClick={() => toggleAll('programs', maintenanceData.programs)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {electionData.eligibleVoters.programs.length === maintenanceData.programs.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  {criteriaErrors.programs && (
                    <p className="text-red-500 text-sm mb-2">{criteriaErrors.programs}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {maintenanceData.programs.map(item => (
                      <label 
                        key={item} 
                        className={`inline-flex items-center px-3 py-1 rounded-full ${
                          electionData.eligibleVoters.programs.includes(item) 
                            ? 'bg-blue-100 border border-blue-300' 
                            : 'border border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={electionData.eligibleVoters.programs.includes(item)}
                          onChange={() => handleCheckboxChange('programs', item)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        <span className="text-black">{item}</span>
                      </label>
                    ))}
                  </div>
                  {electionData.eligibleVoters.programs.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Selected: {electionData.eligibleVoters.programs.join(", ")}
                    </p>
                  )}
                </div>

                {/* Year Levels */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-black">Year Levels</h3>
                    <button
                      type="button"
                      onClick={() => toggleAll('yearLevels', maintenanceData.yearLevels)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {electionData.eligibleVoters.yearLevels.length === maintenanceData.yearLevels.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  {criteriaErrors.yearLevels && (
                    <p className="text-red-500 text-sm mb-2">{criteriaErrors.yearLevels}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {maintenanceData.yearLevels.map(item => (
                      <label 
                        key={item} 
                        className={`inline-flex items-center px-3 py-1 rounded-full ${
                          electionData.eligibleVoters.yearLevels.includes(item) 
                            ? 'bg-blue-100 border border-blue-300' 
                            : 'border border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={electionData.eligibleVoters.yearLevels.includes(item)}
                          onChange={() => handleCheckboxChange('yearLevels', item)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        <span className="text-black">{item}</span>
                      </label>
                    ))}
                  </div>
                  {electionData.eligibleVoters.yearLevels.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Selected: {electionData.eligibleVoters.yearLevels.join(", ")}
                    </p>
                  )}
                </div>

                {/* Semester */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-black">Semester</h3>
                  </div>
                  {criteriaErrors.semester && (
                    <p className="text-red-500 text-sm mb-2">{criteriaErrors.semester}</p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {maintenanceData.semesters.map((semester) => (
                      <label 
                        key={semester} 
                        className={`inline-flex items-center px-3 py-1 rounded-full ${
                          electionData.eligibleVoters.semester.includes(semester) 
                            ? 'bg-blue-100 border border-blue-300' 
                            : 'border border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="semester"
                          checked={electionData.eligibleVoters.semester.includes(semester)}
                          disabled={semester !== currentSemester?.name}
                          onChange={() => handleCheckboxChange('semester', semester)}
                          style={{ accentColor: '#000' }}
                          className={`rounded-md border-black text-black focus:ring-black mr-2 ${semester !== currentSemester?.name ? 'opacity-60' : ''}`}
                        />
                        <span className="text-black">
                          {semester}
                        </span>
                      </label>
                    ))}
                   
                  </div>
                </div>

                {/* Gender */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-black">Gender</h3>
                    <button
                      type="button"
                      onClick={() => toggleAll('gender', maintenanceData.genders)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {electionData.eligibleVoters.gender.length === maintenanceData.genders.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  {criteriaErrors.gender && (
                    <p className="text-red-500 text-sm mb-2">{criteriaErrors.gender}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {maintenanceData.genders.map(item => (
                      <label 
                        key={item} 
                        className={`inline-flex items-center px-3 py-1 rounded-full ${
                          electionData.eligibleVoters.gender.includes(item) 
                            ? 'bg-blue-100 border border-blue-300' 
                            : 'border border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={electionData.eligibleVoters.gender.includes(item)}
                          onChange={() => handleCheckboxChange('gender', item)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        <span className="text-black">{item}</span>
                      </label>
                    ))}
                  </div>
                  {electionData.eligibleVoters.gender.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Selected: {electionData.eligibleVoters.gender.join(", ")}
                    </p>
                  )}
                </div>

                <div className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-black">Precinct</h3>
                    <button
                      type="button"
                      onClick={() => toggleAll('precinct', maintenanceData.precincts)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {electionData.eligibleVoters.precinct.length === maintenanceData.precincts.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  {criteriaErrors.precinct && (
                    <p className="text-red-500 text-sm mb-2">{criteriaErrors.precinct}</p>
                  )}
                  
                  <div className="space-y-4">
                    {maintenanceData.precincts.sort((a, b) => sortPrecincts(a.name || a, b.name || b)).map(precinct => {
                      const precinctName = precinct.name || precinct;
                      const precinctId = precinct.id;
                      
                      return (
                        <div key={precinctName} className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <label 
                              className={`inline-flex items-center px-3 py-2 rounded-lg ${
                                electionData.eligibleVoters.precinct.includes(precinctName)
                                  ? 'bg-blue-100 border border-blue-300' 
                                  : 'border border-gray-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={electionData.eligibleVoters.precinct.includes(precinctName)}
                                onChange={() => handleCheckboxChange('precinct', precinctName)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                              />
                              <span className="text-gray-700 font-medium">{precinctName}</span>
                          </label>
                        </div>

                        {electionData.eligibleVoters.precinct.includes(precinctName) && (
                          <div className="flex-grow">
                            <div className="flex justify-between items-center mb-2">
                              <button
                                type="button"
                                onClick={() => toggleProgramSelection(precinctName)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                {visibleProgramSelections[precinctName] ? (
                                  <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Hide Programs
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                    Show Programs
                                  </>
                                )}
                              </button>
                              {electionData.eligibleVoters.precinctPrograms[precinctName]?.length > 0 && (
                                <span className="text-sm text-gray-500">
                                  {electionData.eligibleVoters.precinctPrograms[precinctName]?.length} program(s) selected
                                </span>
                              )}
                            </div>

                            {visibleProgramSelections[precinctName] && electionData.eligibleVoters.programs.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <p className="text-sm font-medium text-gray-600 mb-2">Select programs for {precinctName}:</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {electionData.eligibleVoters.programs.sort(sortPrograms).map(program => {
                                    const isChecked = electionData.eligibleVoters.precinctPrograms[precinctName]?.includes(program) || false;
                                    
                                    return (
                                      <label 
                                        key={program} 
                                        className="inline-flex items-center bg-white px-2 py-1 rounded"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handlePrecinctProgramChange(precinctName, program)}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                        />
                                        <span className="text-sm text-gray-600">
                                          {program}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {electionData.eligibleVoters.precinct.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Selected: {electionData.eligibleVoters.precinct.sort(sortPrecincts).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="flex items-center px-6 py-2 rounded-lg bg-gray-200 text-black hover:bg-gray-300 transition-colors"
            >
              
              Discard Changes
            </button>
            
            <button
              type="submit"
              disabled={loading.saving}
              className={`flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors ${
                loading.saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading.saving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}