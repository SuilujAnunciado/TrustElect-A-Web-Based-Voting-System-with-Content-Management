'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';

const ElectionDetailPage = () => {
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const electionId = params.id;
  
  useEffect(() => {
    const markRelatedNotificationsAsRead = async () => {
      try {
        const token = Cookies.get('token');
        if (!token || !electionId) return;

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/markReadByEntity`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            entity_type: 'ELECTION',
            entity_id: electionId
          })
        });
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    };

    const loadElection = async () => {
      try {

        await markRelatedNotificationsAsRead();
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    
    loadElection();
  }, [electionId]);

};

export default ElectionDetailPage;