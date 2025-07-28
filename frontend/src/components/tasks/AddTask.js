// frontend/src/components/tasks/AddTask.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddTask = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    type: 'Maintenance',
    deadline: '',
    equipment: '',
    priority: 'Medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    // Fetch users and equipment for dropdowns
    const fetchData = async () => {
      try {
        const [usersRes, equipmentRes] = await Promise.all([
          axios.get('/users'),
          axios.get('/equipment')
        ]);
        
        // Ensure data is in the expected format
        setUsers(Array.isArray(usersRes.data.data) ? usersRes.data.data : []);
        setEquipment(Array.isArray(equipmentRes.data.data) ? equipmentRes.data.data : []);
      } catch (err) {
        console.error('Error fetching ', err);
        setError('Failed to load users and equipment');
        setUsers([]);
        setEquipment([]);
      }
    };
    fetchData();
  }, []);

  const { title, description, assignedTo, type, deadline, equipment: equipmentId, priority } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/tasks', formData);
      console.log('Task created:', res.data);
      alert('Task created successfully!');
      navigate('/tasks');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Task</h1>
          <p className="text-gray-600">Assign tasks to your team</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Task title"
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
              placeholder="Task description"
              rows="3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
            <select
              name="assignedTo"
              value={assignedTo}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="">Select a technician</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
            <select
              name="type"
              value={type}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="Maintenance">Maintenance</option>
              <option value="Repair">Repair</option>
              <option value="Calibration">Calibration</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
            <input
              type="date"
              name="deadline"
              value={deadline}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
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
            {loading ? 'Creating Task...' : 'Create Task'}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Back to Tasks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTask;