// frontend/src/components/equipment/AddEquipment.js
import React, { useState } from 'react';
import api from '../../utils/api';

const AddEquipment = ({ onEquipmentAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'Operational',
    installationDate: '',
    warrantyExpiry: '',
    department: '',
    location: '',
    category: 'Diagnostic',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      // Validate required fields
      if (!formData.name || !formData.manufacturer || !formData.model || !formData.serialNumber || !formData.installationDate) {
        throw new Error('Please fill in all required fields');
      }

      const res = await api.post('/equipment', formData);
      
      // Reset form
      setFormData({
        name: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        status: 'Operational',
        installationDate: '',
        warrantyExpiry: '',
        department: '',
        location: '',
        category: 'Diagnostic',
        notes: ''
      });
      
      // Notify parent component
      if (onEquipmentAdded) {
        onEquipmentAdded(res.data.equipment);
      }
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Equipment</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-800 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter equipment name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer (Brand) *
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter manufacturer"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter model"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter serial number"
                required
              />
            </div>
          </div>
          
          {/* Installation and Status */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Operational">Serviceable</option>
                <option value="Under Maintenance">Unserviceable</option>
                <option value="Out of Service">Unserviceable</option>
                <option value="Decommissioned">Decommissioned</option>
                <option value="Auctioned">Auctioned</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Installation *
              </label>
              <input
                type="date"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty Due Date
              </label>
              <input
                type="date"
                name="warrantyExpiry"
                value={formData.warrantyExpiry}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter department"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter location"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Diagnostic">Diagnostic</option>
                <option value="Therapeutic">Therapeutic</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Support">Support</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Comments Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments / Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any additional notes or comments about the equipment"
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setFormData({
              name: '',
              manufacturer: '',
              model: '',
              serialNumber: '',
              status: 'Operational',
              installationDate: '',
              warrantyExpiry: '',
              department: '',
              location: '',
              category: 'Diagnostic',
              notes: ''
            })}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Equipment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEquipment;