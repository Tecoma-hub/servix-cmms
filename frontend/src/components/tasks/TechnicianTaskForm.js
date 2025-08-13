// frontend/src/components/tasks/TechnicianTaskForm.js
import React, { useState } from 'react';
import api from '../../utils/api';

const TechnicianTaskForm = ({ task, onSuccess }) => {
  const [formData, setFormData] = useState({
    faultDescription: task.faultDescription || '',
    comments: task.comments || '',
    spareParts: task.spareParts || [],
    status: task.status
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [equipmentStatus, setEquipmentStatus] = useState('');
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSparePartsChange = (index, field, value) => {
    const newSpareParts = [...formData.spareParts];
    if (!newSpareParts[index]) {
      newSpareParts[index] = {};
    }
    newSpareParts[index][field] = value;
    setFormData({
      ...formData,
      spareParts: newSpareParts
    });
  };

  const addSparePart = () => {
    setFormData({
      ...formData,
      spareParts: [...formData.spareParts, {}]
    });
  };

  const removeSparePart = (index) => {
    const newSpareParts = formData.spareParts.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      spareParts: newSpareParts
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.put(`/tasks/${task._id}`, formData);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEquipmentStatus = async () => {
    if (!equipmentStatus) {
      setError('Please select equipment status');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.put(`/tasks/${task._id}/equipment-status`, { equipmentStatus });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update equipment status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Task Details</h3>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fault Description
            </label>
            <textarea
              name="faultDescription"
              value={formData.faultDescription}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the fault or issue found..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Comments
            </label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional comments or observations..."
            ></textarea>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-slate-700">
                Required Spare Parts
              </label>
              <button
                type="button"
                onClick={addSparePart}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Part
              </button>
            </div>
            
            {formData.spareParts.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-sm">
                No spare parts added yet
              </div>
            ) : (
              <div className="space-y-3">
                {formData.spareParts.map((part, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Part name"
                      value={part.name || ''}
                      onChange={(e) => handleSparePartsChange(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={part.quantity || ''}
                      onChange={(e) => handleSparePartsChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={part.description || ''}
                      onChange={(e) => handleSparePartsChange(index, 'description', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeSparePart(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Task Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-green-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-70"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      {/* Equipment Status Update (only for completed tasks) */}
      {formData.status === 'Completed' && !showStatusUpdate && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-4">
              Task completed! Please update the equipment status:
            </p>
            <button
              onClick={() => setShowStatusUpdate(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              Update Equipment Status
            </button>
          </div>
        </div>
      )}

      {showStatusUpdate && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Update Equipment Status</h4>
          
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setEquipmentStatus('Serviceable')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                equipmentStatus === 'Serviceable'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Serviceable
            </button>
            <button
              onClick={() => setEquipmentStatus('Decommissioned')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                equipmentStatus === 'Decommissioned'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Decommissioned
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleUpdateEquipmentStatus}
              disabled={loading || !equipmentStatus}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-green-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Confirm Status Update'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianTaskForm;