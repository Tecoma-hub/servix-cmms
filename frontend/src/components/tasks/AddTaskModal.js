// frontend/src/components/tasks/AddTaskModal.js
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AddTaskModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'Inspection',  // default to one of your requested types
    priority: 'Medium',
    assignedTo: '',
    equipmentId: '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const techRes = await api.get('/users?role=technician');
        setTechnicians(techRes.data.users || []);

        const equipRes = await api.get('/equipment');
        setEquipmentList(equipRes.data.equipment || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!formData.title || !formData.priority || !formData.equipmentId || !formData.assignedTo) {
      setError('Please fill all required fields: title, priority, equipment, and assigned technician');
      return;
    }

    try {
      setLoading(true);

      // Send form data to backend
      await api.post('/tasks', formData);

      if (onSuccess) {
        onSuccess();
      }

      onClose();

      // Reset form data
      setFormData({
        title: '',
        description: '',
        taskType: 'Inspection',
        priority: 'Medium',
        assignedTo: '',
        equipmentId: '',
        dueDate: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Assign New Task</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Column */}
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="title">
                  Task Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter task title"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Task details and instructions..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="taskType">
                  Task Type
                </label>
                <select
                  id="taskType"
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Inspection">Inspection</option>
                  <option value="Installation">Installation</option>
                  <option value="Corrective Maintenance">Corrective Maintenance</option>
                  <option value="Decommissioning">Decommissioning</option>
                  <option value="Calibration">Calibration</option>
                </select>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="priority">
                  Priority *
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="dueDate">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="assignedTo">
                  Assign to Technician *
                </label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Technician</option>
                  {technicians.map(tech => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name} ({tech.serviceNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="equipmentId">
                  Equipment *
                </label>
                <select
                  id="equipmentId"
                  name="equipmentId"
                  value={formData.equipmentId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Equipment</option>
                  {equipmentList.map(equip => (
                    <option key={equip._id} value={equip._id}>
                      {equip.name} - {equip.serialNumber}
                    </option>
                  ))}
                </select>
              </div>

            </div>

          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-green-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Task...
                </div>
              ) : (
                'Create Task'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
