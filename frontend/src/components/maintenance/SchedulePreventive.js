// frontend/src/components/maintenance/SchedulePreventive.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SchedulePreventive = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    equipment: '',
    title: '',
    description: '',
    scheduledDate: '',
    frequency: 'Monthly',
    duration: '',
    assignedTo: '',
    priority: 'Medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch equipment and users for dropdowns
    const fetchData = async () => {
      try {
        const [equipmentRes, usersRes] = await Promise.all([
          axios.get('/equipment'),
          axios.get('/users')
        ]);
        
        setEquipment(Array.isArray(equipmentRes.data.data) ? equipmentRes.data.data : []);
        setUsers(Array.isArray(usersRes.data.data) ? usersRes.data.data : []);
      } catch (err) {
        console.error('Error fetching ', err);
        setError('Failed to load equipment and users');
      }
    };
    fetchData();
  }, []);

  const { 
    equipment: equipmentId, title, description, scheduledDate, 
    frequency, duration, assignedTo, priority 
  } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/maintenance/schedule', formData);
      console.log('Preventive maintenance scheduled:', res.data);
      alert('Preventive maintenance scheduled successfully!');
      navigate('/maintenance');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule preventive maintenance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Preventive Maintenance</h1>
          <p className="text-gray-600">Plan regular maintenance for equipment</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
            <select
              name="equipment"
              value={equipmentId}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="">Select equipment</option>
              {equipment.map(item => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.serialNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Maintenance title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={description}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Maintenance description"
              rows="3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
            <input
              type="date"
              name="scheduledDate"
              value={scheduledDate}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <select
              name="frequency"
              value={frequency}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Semi-Annually">Semi-Annually</option>
              <option value="Annually">Annually</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration (hours)</label>
            <input
              type="number"
              name="duration"
              value={duration}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Estimated duration in hours"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
            <select
              name="assignedTo"
              value={assignedTo}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Select technician</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              name="priority"
              value={priority}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Scheduling...' : 'Schedule Maintenance'}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/maintenance')}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Back to Maintenance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchedulePreventive;