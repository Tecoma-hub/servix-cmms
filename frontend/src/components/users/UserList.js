// frontend/src/components/users/UserList.js
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const UserList = ({ onSelect, selectedUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        
        const res = await api.get('/api/users');
        // Filter to show only technicians
        const technicians = Array.isArray(res.data.users) ? res.data.users.filter(user => user.role === 'Technician') : [];
        setUsers(technicians);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch technicians');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="py-2">
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-teal-600 border-r-transparent"></div>
        <span className="ml-2 text-sm text-gray-600">Loading technicians...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <select
      value={selectedUserId || ''}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select technician</option>
      {users.map(user => (
        <option key={user._id} value={user._id}>
          {user.name}
        </option>
      ))}
    </select>
  );
};

export default UserList;