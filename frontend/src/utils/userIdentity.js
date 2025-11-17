import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const formatName = (data) => {
  if (!data) return '';
  const possibleFields = [
    data.fullName,
    data.full_name,
    data.name,
    [data.firstName, data.lastName].filter(Boolean).join(' ').trim(),
    [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
  ].filter(Boolean);

  return possibleFields[0] || '';
};

export const fetchCurrentUserName = async () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = Cookies.get('token');
  const role = Cookies.get('role');
  if (!token || !role) {
    return Cookies.get('email') || null;
  }

  const headers = { Authorization: `Bearer ${token}` };

  const tryRequest = async (url) => {
    const response = await axios.get(url, { headers });
    return response.data;
  };

  try {
    if (role === 'Super Admin') {
      const profile = await tryRequest(`${API_BASE}/superadmin/profile`);
      const name = formatName(profile);
      return name || profile?.email || Cookies.get('email') || 'Unknown User';
    }

    if (role === 'Admin') {
      const profile = await tryRequest(`${API_BASE}/admin/profile`);
      const name = formatName(profile);
      return name || profile?.email || Cookies.get('email') || 'Unknown User';
    }

    if (role === 'Student') {
      const profile = await tryRequest(`${API_BASE}/students/profile`);
      const name = formatName(profile);
      return name || profile?.email || Cookies.get('email') || 'Unknown User';
    }
  } catch (error) {
    console.error('Error fetching current user profile:', error);
  }

  return Cookies.get('email') || 'Unknown User';
};

export const buildSignatureFooter = (userName) => {
  const resolvedName = (userName && userName.trim()) || '________________________';
  return [
    `Reviewed by: ${resolvedName}`,
    `Checked by: ${resolvedName}`,
    'Approved by: ________________________'
  ].join('\n');
};

