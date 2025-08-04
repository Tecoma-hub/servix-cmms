// frontend/src/components/equipment/EquipmentDetail.js
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const EquipmentDetail = ({ equipment: initialEquipment, onEquipmentUpdated }) => {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get equipment status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Serviceable':
        return 'bg-green-500 text-white';
      case 'Under Maintenance':
        return 'bg-yellow-500 text-white';
      case 'Unserviceable':
        return 'bg-red-500 text-white';
      case 'Decommissioned':
        return 'bg-gray-500 text-white';
      case 'Auctioned':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  // Refresh equipment data
  const refreshEquipment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/equipment/${equipment._id}`);
      setEquipment(res.data.equipment);
      if (onEquipmentUpdated) {
        onEquipmentUpdated(res.data.equipment);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh equipment data');
    } finally {
      setLoading(false);
    }
  };

  // Effect to update local state when initialEquipment changes
  useEffect(() => {
    setEquipment(initialEquipment);
  }, [initialEquipment]);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-gray-900">{equipment.name}</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(equipment.status)}`}>
            {equipment.status}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Serial Number:</span>
                <span className="text-sm font-medium text-gray-900">{equipment.serialNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Model:</span>
                <span className="text-sm font-medium text-gray-900">{equipment.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Manufacturer:</span>
                <span className="text-sm font-medium text-gray-900">{equipment.manufacturer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium text-gray-900">{equipment.category}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Installation</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{equipment.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Location:</span>
                <span className="text-sm font-medium text-gray-900">{equipment.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Installation Date:</span>
                <span className="text-sm font-medium text-gray-900">{new Date(equipment.installationDate).toLocaleDateString()}</span>
              </div>
              {equipment.warrantyExpiry && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Warranty Expiry:</span>
                  <span className="text-sm font-medium text-gray-900">{new Date(equipment.warrantyExpiry).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(equipment.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm text-gray-600">{key}:</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {equipment.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{equipment.notes}</p>
          </div>
        )}
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Refreshing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentDetail;