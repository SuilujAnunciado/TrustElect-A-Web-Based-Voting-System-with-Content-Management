"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, User, Award, AlertCircle, SortDesc, SortAsc, Medals, Trophy } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const API_BASE = '/api';
const BASE_URL = '';

// Add color palette for different candidates
const CHART_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export default function ElectionResultsPage({ params }) {
  const resolvedParams = React.use(params);
  const { id: electionId } = resolvedParams;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [election, setElection] = useState(null);
  const [candidateImages, setCandidateImages] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [sortOrder, setSortOrder] = useState({});
  const [expandedCandidate, setExpandedCandidate] = useState(null);

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/default-candidate.png';
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Fix the image URL construction to avoid Next.js image optimization issues
    if (imageUrl.startsWith('/uploads')) {
      return `${API_BASE}${imageUrl}`;
    }
    
    if (!imageUrl.startsWith('/')) {
      return `${API_BASE}/uploads/candidates/${imageUrl}`;
    }
    
    return `${API_BASE}${imageUrl}`;
  };

  const handleImageError = (candidateId) => {
    setImageErrors(prev => ({
      ...prev,
      [candidateId]: true
    }));
  };

  const toggleSortOrder = (positionId) => {
    setSortOrder(prev => ({
      ...prev,
      [positionId]: prev[positionId] === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleCandidateDetails = (candidateId) => {
    setExpandedCandidate(expandedCandidate === candidateId ? null : candidateId);
  };

  const formatResultsData = (positions) => {
    if (!positions || positions.length === 0) return [];
    
    // Create formatted data for each position
    return positions.map(position => {
      // Sort candidates by vote count in descending order
      let sortedCandidates = [...(position.candidates || [])];
      
      // Calculate total votes for percentage calculation
      const totalVotes = sortedCandidates.reduce((sum, candidate) => sum + (candidate.vote_count || 0), 0);
      
      // Apply the current sort order for this position
      if (sortOrder[position.id] === 'asc') {
        sortedCandidates.sort((a, b) => (a.vote_count || 0) - (b.vote_count || 0));
      } else {
        sortedCandidates.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
      }
      
      // Add percentage and ranking to each candidate
      const candidatesWithStats = sortedCandidates.map((candidate, index) => {
        const voteCount = candidate.vote_count || 0;
        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : 0;
        const ranking = sortOrder[position.id] === 'desc' ? index + 1 : sortedCandidates.length - index;
        
        return {
          ...candidate,
          percentage: parseFloat(percentage),
          ranking,
          isWinner: sortOrder[position.id] === 'desc' && index === 0,
          isSecond: sortOrder[position.id] === 'desc' && index === 1,
          isThird: sortOrder[position.id] === 'desc' && index === 2
        };
      });
      
      // Format for chart with unique colors for each candidate
      const chartData = candidatesWithStats.map((candidate, index) => ({
        name: `${candidate.first_name} ${candidate.last_name}`,
        votes: candidate.vote_count || 0,
        party: candidate.party || 'Independent',
        percentage: candidate.percentage,
        // Assign a color based on index, cycling through the array if needed
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));
      
      return {
        ...position,
        sortedCandidates: candidatesWithStats,
        chartData,
        totalVotes
      };
    });
  };

  const fetchElectionResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get authentication token
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
 
      const response = await axios.get(`${API_BASE}/elections/${electionId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Election results data:', response.data);
      

      const electionData = response.data.election;
      if (electionData.status !== 'completed') {
        throw new Error('Results are only available for completed elections');
      }
    
      const initialSortOrder = {};
      if (electionData.positions) {
        electionData.positions.forEach(position => {
          initialSortOrder[position.id] = 'desc'; 
        });
      }
      setSortOrder(initialSortOrder);
      
      // Process candidate images
      const imageCache = {};
      if (electionData?.positions) {
        electionData.positions.forEach(position => {
          position.candidates?.forEach(candidate => {
            if (candidate.image_url) {
              const processedUrl = getImageUrl(candidate.image_url);
              imageCache[candidate.id] = processedUrl;
            }
          });
        });
      }
      
      setCandidateImages(imageCache);
      setElection(electionData);
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
      } else if (err.request) {
        setError('Failed to receive response from server. Please check your network connection.');
      } else {
        setError(err.message || 'An error occurred while loading election results');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElectionResults();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.push('/student')} 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Election Results</h1>
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            OFFICIAL RESULTS
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-black">Title: {election.title}</h2>
          <p className="mb-4 text-black">Description: {election.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-black">Election Dates</p>
              <p className="text-sm text-black">From: {new Date(election.date_from).toLocaleDateString()} to {new Date(election.date_to).toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-black">Participation</p>
              <p className="text-black">{Number(election.vote_count || 0).toLocaleString()} out of <span className="font-semibold">{Number(election.voter_count || 0).toLocaleString()}</span> eligible voters
                      ({election.voter_count ? ((election.vote_count / election.voter_count) * 100).toFixed(2) : '0.00'}% participation)</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Result</h2>
          
          {formatResultsData(election.positions).map(position => (
            <div key={position.id} className="mb-8 pb-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-black">Position Name: {position.name}</h3>
                <button
                  onClick={() => toggleSortOrder(position.id)}
                  className="flex items-center bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-blue-700 text-sm transition-colors"
                >
                  {sortOrder[position.id] === 'asc' ? (
                    <>
                      <SortAsc className="w-4 h-4 mr-1" />
                      Lowest First
                    </>
                  ) : (
                    <>
                      <SortDesc className="w-4 h-4 mr-1" />
                      Highest First
                    </>
                  )}
                </button>
              </div>
              
              {/* Results chart */}
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={position.chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis 
                      domain={[0, 'dataMax']}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value.toLocaleString()} votes (${position.chartData.find(d => d.votes === value)?.percentage || 0}%)`, 
                        'Votes'
                      ]}
                      labelFormatter={(name) => `${name}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="votes" 
                      name="Vote Count" 
                      isAnimationActive={true}
                      maxBarSize={60}
                    >
                      {position.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Candidates sorted by votes */}
              <div className="space-y-4">
                {position.sortedCandidates.map((candidate, index) => {
                  // Determine styling based on ranking
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
                    <div 
                      key={candidate.id} 
                      className={`rounded-lg overflow-hidden ${rankingStyle.container} shadow-md`}
                    >
                      <div className="p-4">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex items-start mb-4 md:mb-0 md:mr-6">
                            <div className="relative w-24 h-24">
                              {candidate.image_url && !imageErrors[candidate.id] ? (
                                <img
                                  src={candidateImages[candidate.id] || getImageUrl(candidate.image_url)}
                                  alt={`${candidate.first_name} ${candidate.last_name}`}
                                  className="w-24 h-24 object-cover rounded-full"
                                  onError={() => handleImageError(candidate.id)}
                                />
                              ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-12 h-12 text-gray-400" />
                                </div>
                              )}
                              {/* Ranking badge */}
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
                              <p className="text-sm font-medium text-black">Party/Organization:</p>
                              <p className="text-black">{candidate.party || 'Independent'}</p>
                            </div>
                            
                            {candidate.slogan && (
                              <div>
                                <p className="text-sm font-medium text-black">Campaign Slogan:</p>
                                <p className="text-black italic">"{candidate.slogan}"</p>
                              </div>
                            )}
                            
                            {candidate.course && (
                              <div>
                                <p className="text-sm font-medium text-black">Course:</p>
                                <p className="text-black">{candidate.course}</p>
                              </div>
                            )}
                            
                            {candidate.year_level && (
                              <div>
                                <p className="text-sm font-medium text-black">Year Level:</p>
                                <p className="text-black">{candidate.year_level}</p>
                              </div>
                            )}
                            
                            <div className="col-span-2 mt-2">
                              <p className="text-sm font-medium text-black">Platform:</p>
                              <p className="text-black line-clamp-2">{candidate.platform || 'No platform provided'}</p>
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
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 text-black mt-0.5" />
            <div>
              <h3 className="font-medium text-black">Official Election Results</h3>
              <p className="text-sm text-black">
                These results are final.
                Results were finalized on {new Date(election.date_to).toLocaleDateString()} at {election.end_time}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}