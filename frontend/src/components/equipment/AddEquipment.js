// frontend/src/components/equipment/AddEquipment.js
import React, { useState } from 'react';
import api from '../../utils/api';

const AddEquipment = ({ onEquipmentAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: 'Serviceable',
    manufacturer: '',
    model: '',
    serialNumber: '',
    department: '',
    location: '',
    installationDate: '',
    warrantyExpiry: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    name,
    status,
    manufacturer,
    model,
    serialNumber,
    department,
    location,
    installationDate,
    warrantyExpiry,
    category
  } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'Serviceable',
      manufacturer: '',
      model: '',
      serialNumber: '',
      department: '',
      location: '',
      installationDate: '',
      warrantyExpiry: '',
      category: ''
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !name ||
      !status ||
      !manufacturer ||
      !model ||
      !serialNumber ||
      !department ||
      !location ||
      !installationDate ||
      !category
    ) {
      setError('Please fill in all required fields');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/equipment', formData);

      if (response.status === 201) {
        setSuccess('Equipment added successfully!');
        resetForm();
        if (onEquipmentAdded) {
          onEquipmentAdded(response.data);
        }
      } else {
        setError('Unexpected response from server');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Add New Equipment</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Equipment Name *
              </label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter equipment name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Manufacturer *
              </label>
              <input
                type="text"
                name="manufacturer"
                value={manufacturer}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter manufacturer name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={model}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter model number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Serial Number *
              </label>
              <input
                type="text"
                name="serialNumber"
                value={serialNumber}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter serial number"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={department}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={location}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Installation Date *
              </label>
              <input
                type="date"
                name="installationDate"
                value={installationDate}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Warranty Expiry
              </label>
              <input
                type="date"
                name="warrantyExpiry"
                value={warrantyExpiry}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={status}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Serviceable">Serviceable</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Unserviceable">Unserviceable</option>
                <option value="Decommissioned">Decommissioned</option>
                <option value="Auctioned">Auctioned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                name="category"
                value={category}
                onChange={onChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-green-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-70"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Adding Equipment...
              </div>
            ) : (
              'Add Equipment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEquipment;
