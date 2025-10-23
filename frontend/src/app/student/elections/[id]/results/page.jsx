"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Award, AlertCircle, SortDesc, SortAsc, Medals, Trophy } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = '/api';

export default function ElectionResultsPage({ params }) {
  const { id: electionId } = params;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [election, setElection] = useState(null);
  const [candidateImages, setCandidateImages] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [sortOrder, setSortOrder] = useState({});

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/default-candidate.png';
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    if (imageUrl.startsWith('/uploads')) {
      return `${API_BASE}${imageUrl}`;
    }
    
    if (!imageUrl.startsWith('/')) {
      return `${API_BASE}/uploads/candidates/${imageUrl}`;
    }
    
    return `${API_BASE}${imageUrl}`;
  };

  const handleImageError = (candidateId) => {
    setImageErrors(prev => ({ ...prev, [candidateId]: true }));
  };

  const toggleSortOrder = (positionId) => {
    setSortOrder(prev => ({
      ...prev,
      [positionId]: prev[positionId] === 'desc' ? 'asc' : 'desc'
    }));
  };

  const formatResultsData = (positions) => {
    if (!positions || !Array.isArray(positions) || positions.length === 0) return [];
    
    return positions.map(position => {
      if (!position || !position.position_id) return null;
      
      let sortedCandidates = [...(position.candidates || [])];
      const totalVotes = sortedCandidates.reduce((sum, candidate) => sum + (candidate.vote_count || 0), 0);
      
      if (sortOrder[position.position_id] === 'asc') {
        sortedCandidates.sort((a, b) => (a.vote_count || 0) - (b.vote_count || 0));
      } else {
        sortedCandidates.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
      }
      
      const candidatesWithStats = sortedCandidates.map((candidate, index) => {
        const voteCount = candidate.vote_count || 0;
        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : 0;
        const ranking = sortOrder[position.position_id] === 'desc' ? index + 1 : sortedCandidates.length - index;
        
        return {
          ...candidate,
          percentage: parseFloat(percentage),
          ranking,
          isWinner: sortOrder[position.position_id] === 'desc' && index === 0,
          isSecond: sortOrder[position.position_id] === 'desc' && index === 1,
          isThird: sortOrder[position.position_id] === 'desc' && index === 2
        };
      });
      
      return {
        ...position,
        id: position.position_id,
        name: position.position_name,
        sortedCandidates: candidatesWithStats,
        totalVotes
      };
    }).filter(Boolean);
  };

  const fetchElectionResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await axios.get(`${API_BASE}/elections/completed/${electionId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const { election: electionData, positions } = response.data.data;
      
      if (electionData.status !== 'completed') {
        throw new Error('Results are only available for completed elections');
      }

      const electionWithPositions = {
        ...electionData,
        positions: positions
      };

      const initialSortOrder = {};
      if (positions) {
        positions.forEach(position => {
          initialSortOrder[position.position_id] = 'desc'; 
        });
      }
      setSortOrder(initialSortOrder);
      
      const imageCache = {};
      if (positions) {
        positions.forEach(position => {
          position.candidates?.forEach(candidate => {
            if (candidate.image_url) {
              const processedUrl = getImageUrl(candidate.image_url);
              imageCache[candidate.id] = processedUrl;
            }
          });
        });
      }
      
      setCandidateImages(imageCache);
      setElection(electionWithPositions);
    } catch (err) {
      console.error('Error fetching election results:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError('Election not found');
        } else if (err.response.status === 403) {
          setError('You are not authorized to view these results');
        } else {
          setError(err.response.data?.message || 'Failed to load election results');
        }
      } else {
        setError(err.message || 'An error occurred while loading results');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (electionId) {
      fetchElectionResults();
    }
  }, [electionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.push('/student')} 
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Results Unavailable</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const resultsData = formatResultsData(election.positions);

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.push('/student')} 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Dashboard
      </button>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">{election.title}</h1>
          <p className="text-gray-600">{election.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total Voters</h3>
            <p className="text-2xl font-bold text-blue-900">{election.total_eligible_voters || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Votes Cast</h3>
            <p className="text-2xl font-bold text-green-900">{election.total_votes || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Participation</h3>
            <p className="text-2xl font-bold text-purple-900">
              {election.voter_turnout_percentage ? election.voter_turnout_percentage.toFixed(2) : '0.00'}%
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Results</h2>
          
          {resultsData.length > 0 ? resultsData.map(position => (
            <div key={position.id} className="mb-8 pb-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-black">Position: {position.name}</h3>
                <button
                  onClick={() => toggleSortOrder(position.id)}
                  className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {sortOrder[position.id] === 'desc' ? (
                    <>
                      <SortDesc className="w-4 h-4 mr-1" />
                      Sort Ascending
                    </>
                  ) : (
                    <>
                      <SortAsc className="w-4 h-4 mr-1" />
                      Sort Descending
                    </>
                  )}
                </button>
              </div>
              
              <div className="space-y-4">
                {position.sortedCandidates && position.sortedCandidates.length > 0 ? position.sortedCandidates.map((candidate, index) => {
                  const getRankingStyle = () => {
                    if (candidate.isWinner) {
                      return {
                        container: 'border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-yellow-100',
                        badge: 'bg-yellow-500 text-white',
                        icon: <Trophy className="w-5 h-5" />
                      };
                    } else if (candidate.isSecond) {
                      return {
                        container: 'border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100',
                        badge: 'bg-gray-500 text-white',
                        icon: <Medals className="w-5 h-5" />
                      };
                    } else if (candidate.isThird) {
                      return {
                        container: 'border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100',
                        badge: 'bg-orange-500 text-white',
                        icon: <Award className="w-5 h-5" />
                      };
                    } else {
                      return {
                        container: 'border border-gray-200 bg-white',
                        badge: 'bg-gray-400 text-white',
                        icon: <User className="w-4 h-4" />
                      };
                    }
                  };
                  
                  const rankingStyle = getRankingStyle();
                  
                  return (
                    <div key={candidate.id} className={`rounded-lg overflow-hidden ${rankingStyle.container} shadow-md`}>
                      <div className="p-4">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex items-start mb-4 md:mb-0 md:mr-6">
                            <div className="relative w-24 h-24">
                              {imageErrors[candidate.id] ? (
                                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="w-8 h-8 text-gray-400" />
                                </div>
                              ) : (
                                <img
                                  src={candidateImages[candidate.id] || getImageUrl(candidate.image_url)}
                                  alt={`${candidate.first_name} ${candidate.last_name}`}
                                  className="w-24 h-24 object-cover rounded-full"
                                  onError={() => handleImageError(candidate.id)}
                                />
                              )}
                              <div className={`absolute -top-2 -right-2 ${rankingStyle.badge} rounded-full p-2 flex items-center justify-center`}>
                                {rankingStyle.icon}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                            <div className="col-span-2 mb-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xl font-bold text-black">
                                  {candidate.first_name} {candidate.last_name}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  {candidate.isWinner && (
                                    <span className="px-3 py-1 bg-yellow-500 text-white font-bold text-sm rounded-full flex items-center">
                                      <Trophy className="w-4 h-4 mr-1" />
                                      1st Place
                                    </span>
                                  )}
                                  {candidate.isSecond && (
                                    <span className="px-3 py-1 bg-gray-500 text-white font-bold text-sm rounded-full flex items-center">
                                      <Medals className="w-4 h-4 mr-1" />
                                      2nd Place
                                    </span>
                                  )}
                                  {candidate.isThird && (
                                    <span className="px-3 py-1 bg-orange-500 text-white font-bold text-sm rounded-full flex items-center">
                                      <Award className="w-4 h-4 mr-1" />
                                      3rd Place
                                    </span>
                                  )}
                                  {!candidate.isWinner && !candidate.isSecond && !candidate.isThird && (
                                    <span className="px-3 py-1 bg-gray-400 text-white font-bold text-sm rounded-full">
                                      #{candidate.ranking}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-black mb-1">Party/List:</p>
                              <p className="text-black">{candidate.partylist_name || 'Independent'}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-black mb-1">Department:</p>
                              <p className="text-black">{candidate.department || 'N/A'}</p>
                            </div>
                            
                            <div className="col-span-2 mt-3">
                              <p className="text-sm font-medium text-black mb-1">Votes Received:</p>
                              <div className="flex items-center">
                                <div className="w-full max-w-md h-4 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      candidate.isWinner ? 'bg-yellow-500' : 
                                      candidate.isSecond ? 'bg-gray-500' : 
                                      candidate.isThird ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${candidate.percentage || 0}%` }}
                                  />
                                </div>
                                <span className="ml-3 text-black font-bold text-lg">
                                  {candidate.vote_count || 0} votes ({candidate.percentage || 0}%)
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-black">
                                  <span className="font-medium">Ranking:</span> #{candidate.ranking} of {position.sortedCandidates.length}
                                </p>
                                {candidate.isWinner && (
                                  <span className="text-yellow-600 font-bold text-sm">
                                    🏆 WINNER
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No candidates available for this position</p>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <p>No election results available</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 text-black mt-0.5" />
            <div>
              <h3 className="font-medium text-black">Official Election Results</h3>
              <p className="text-sm text-black">
                These results are final. Results were finalized on {new Date(election.date_to).toLocaleDateString()} at {election.end_time}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}