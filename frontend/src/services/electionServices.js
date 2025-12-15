"use client";
import axios from 'axios';
import { getAuthHeader } from './authService';

<<<<<<< HEAD
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''; 
=======
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''; // Remove '/api/elections'
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b

const ElectionServices = {
  async createElection(electionData) {
    try {
      const response = await axios.post(`${API_BASE}/create`, electionData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

<<<<<<< HEAD
  
=======
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  async getElections() {
    try {
      const response = await axios.get(API_BASE, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getElectionDetails(id) {
    try {
      const response = await axios.get(`${API_BASE}/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateElection(id, updates) {
    try {
      const response = await axios.put(`${API_BASE}/${id}`, updates, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async deleteElection(id) {
    try {
      const response = await axios.delete(`${API_BASE}/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  handleError(error) {
    if (error.response) {
<<<<<<< HEAD
=======
      // Server responded with error status
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      return {
        message: error.response.data.message || 'Request failed',
        status: error.response.status
      };
    } else if (error.request) {
<<<<<<< HEAD
      return { message: 'No response from server', status: 0 };
    } else {
=======
      // No response received
      return { message: 'No response from server', status: 0 };
    } else {
      // Request setup error
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      return { message: error.message, status: -1 };
    }
  }
};

export default ElectionServices;