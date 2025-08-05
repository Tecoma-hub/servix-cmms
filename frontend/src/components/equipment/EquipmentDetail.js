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
        return 'bg-green-600 text-white border border-green-700';
      case 'Under Maintenance':
        return 'bg-yellow-600 text-white border border-yellow-700';
      case 'Unserviceable':
        return 'bg-red-600 text-white border border-red-700';
      case 'Decommissioned':
        return 'bg-gray-600 text-white border border-gray-700';
      case 'Auctioned':
        return 'bg-purple-600 text-white border border-purple-700';
      default:
        return 'bg-blue-600 text-white border border-blue-700';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Serviceable':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'Under Maintenance':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'Unserviceable':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'Decommissioned':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'Auctioned':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.269V6.15a1.5 1.5 0 00-1.5-1.5c-.425 0-.82-.137-1.125-.375.162-.32.42-.58.775-.725.355-.145.75-.225 1.175-.225.833 0 1.5.667 1.5 1.5 0 .425-.137.82-.375 1.125-.238.305-.575.52-.975.633.103.103.196.24.269.418.103.22.18.47.225.75.045.28.067.58.067.9 0 .833-.667 1.5-1.5 1.5s-1.5-.667-1.5-1.5c0-.425.137-.82.375-1.125.238-.305.575-.52.975-.633-.103-.103-.196-.24-.269-.418-.103-.22-.18-.47-.225-.75-.045-.28-.067-.58-.067-.9 0-.833.667-1.5 1.5-1.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Refresh equipment data
  const refreshEquipment = async () => {
    try {
      setLoading(true);
      setError('');
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
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{equipment.name}</h2>
            <p className="text-slate-600">Serial: {equipment.serialNumber}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={refreshEquipment}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors duration-200 disabled:opacity-50"
              title="Refresh equipment data"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-8">
        {/* Status Badge */}
        <div className="flex justify-end mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-xl font-medium ${getStatusColor(equipment.status)}`}>
            {getStatusIcon(equipment.status)}
            <span className="ml-2">{equipment.status}</span>
          </span>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-6">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Serial Number</span>
                <span className="text-sm text-slate-800 font-semibold">{equipment.serialNumber}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Model</span>
                <span className="text-sm text-slate-800 font-semibold">{equipment.model}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Manufacturer</span>
                <span className="text-sm text-slate-800 font-semibold">{equipment.manufacturer}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Category</span>
                <span className="text-sm text-slate-800 font-semibold">{equipment.category}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-6">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location & Installation
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Department</span>
                <span className="text-sm text-slate-800 font-semibold">{equipment.department}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Location</span>
                <span className="text-sm text-slate-800 font-semibold">{equipment.location}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Installation Date</span>
                <span className="text-sm text-slate-800 font-semibold">{new Date(equipment.installationDate).toLocaleDateString()}</span>
              </div>
              {equipment.warrantyExpiry && (
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-sm font-medium text-slate-700">Warranty Expiry</span>
                  <span className="text-sm text-slate-800 font-semibold">{new Date(equipment.warrantyExpiry).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Specifications */}
        {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-6">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(equipment.specifications).map(([key, value]) => (
                <div key={key} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{key}</span>
                    <span className="text-sm text-slate-800 font-semibold">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Notes */}
        {equipment.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-4">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Notes
            </h3>
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-700 leading-relaxed">{equipment.notes}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-3 text-slate-600 font-medium">Refreshing equipment data...</p>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm text-center">
            <svg className="w-8 h-8 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentDetail;