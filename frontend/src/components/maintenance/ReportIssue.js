// frontend/src/components/maintenance/ReportIssue.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ReportIssue = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    equipment: '',
    title: '',
    description: '',
    severity: 'Medium',
    location: '',
    reportedBy: user?.name || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    // Fetch equipment for dropdown
    const fetchEquipment = async () => {
      try {
        const res = await axios.get('/equipment');
        setEquipment(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        console.error('Error fetching equipment:', err);
        setError('Failed to load equipment');
      }
    };
    fetchEquipment();
  }, []);

  const { equipment: equipmentId, title, description, severity, location, reportedBy } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/maintenance/report', formData);
      console.log('Issue reported:', res.data);
      alert('Issue reported successfully!');
      navigate('/maintenance');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Equipment Issue</h1>
          <p className="text-gray-600">Report problems with equipment</p>
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
              placeholder="Issue title"
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
              placeholder="Describe the issue"
              rows="3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              name="severity"
              value={severity}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={location}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Where is the issue located?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reported By</label>
            <input
              type="text"
              name="reportedBy"
              value={reportedBy}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Your name"
              readOnly
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Reporting Issue...' : 'Report Issue'}
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

export default ReportIssue;