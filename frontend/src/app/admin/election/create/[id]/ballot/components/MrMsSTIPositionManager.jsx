import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';


export const useMrMsSTIPositions = () => {
  const [mrMsSTIPositions, setMrMsSTIPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMrMsSTIPositions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = Cookies.get("token");
      
      const typesResponse = await axios.get('/api/maintenance/election-types', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      let mrMsSTITypeId = null;
      if (typesResponse.data.success && typesResponse.data.data) {
        const mrMsSTIType = typesResponse.data.data.find(type => 
          type.name && type.name.toLowerCase().includes("mr") && 
          type.name.toLowerCase().includes("ms") && 
          type.name.toLowerCase().includes("sti")
        );
        if (mrMsSTIType) {
          mrMsSTITypeId = mrMsSTIType.id;
        }
      }

      if (mrMsSTITypeId) {
        const response = await axios.get(`/api/maintenance/positions?electionTypeId=${mrMsSTITypeId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          const positions = response.data.data.map(pos => pos.name);
          positions.sort((a, b) => (mrMsSTIPositionOrder[a] || 999) - (mrMsSTIPositionOrder[b] || 999));
          setMrMsSTIPositions(positions);
          
          localStorage.setItem('mrMsSTIPositions', JSON.stringify(positions));
          return;
        }
      }

      const response = await axios.get('/api/maintenance/positions', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      if (response.data.success && response.data.data) {
        const allPositions = response.data.data;
        
        const mrMsSTIPositions = allPositions.filter(pos => 
          pos.name && (
            pos.name.toLowerCase().includes("mr") && 
            pos.name.toLowerCase().includes("sti") ||
            pos.name.toLowerCase().includes("ms") && 
            pos.name.toLowerCase().includes("sti")
          )
        ).map(pos => pos.name);
        
        if (mrMsSTIPositions.length > 0) {
          mrMsSTIPositions.sort((a, b) => (mrMsSTIPositionOrder[a] || 999) - (mrMsSTIPositionOrder[b] || 999));
          setMrMsSTIPositions(mrMsSTIPositions);
          
          localStorage.setItem('mrMsSTIPositions', JSON.stringify(mrMsSTIPositions));
          return;
        }
      }

      
    } catch (error) {
      console.error("Error fetching Mr/Ms STI positions:", error);
      setError(error.message);
      try {
        const cachedPositions = localStorage.getItem('mrMsSTIPositions');
        if (cachedPositions) {
          const positions = JSON.parse(cachedPositions);
          setMrMsSTIPositions(positions);
        } 
      } catch (cacheError) {
        console.error("Error loading from cache:", cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMrMsSTIPositions();
  }, []);

  return {
    mrMsSTIPositions,
    fetchMrMsSTIPositions,
    mrMsSTIPositionOrder,
    isLoading,
    error
  };
};
