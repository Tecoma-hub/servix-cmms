// frontend/src/components/equipment/Equipment.js
import React, { useState, useEffect, useMemo } from 'react';
import AddEquipment from './AddEquipment';
import api from '../../utils/api';

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        setError('');
        
        const res = await api.get('/equipment');
        setEquipment(Array.isArray(res.data.equipment) ? res.data.equipment : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch equipment');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  // Get unique departments for dropdown
  const departments = useMemo(() => {
    if (!equipment || equipment.length === 0) return [];
    const uniqueDepartments = [...new Set(equipment.map(item => item.department))];
    return ['All Departments', ...uniqueDepartments.sort()];
  }, [equipment]);

  // Filter equipment based on search term and selected department
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search across multiple fields
      const matchesSearch = 
        item.name.toLowerCase().includes(searchLower) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(searchLower)) ||
        (item.model && item.model.toLowerCase().includes(searchLower)) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower)) ||
        (item.location && item.location.toLowerCase().includes(searchLower));
      
      const matchesDepartment = !selectedDepartment || 
        selectedDepartment === 'All Departments' || 
        item.department === selectedDepartment;
      
      return matchesSearch && matchesDepartment;
    });
  }, [equipment, searchTerm, selectedDepartment]);

  // Get equipment status color with requested color scheme
  const getStatusColor = (status) => {
    switch (status) {
      case 'Serviceable':
      case 'Operational':
        return 'bg-green-500 text-white';
      case 'Unserviceable':
      case 'Under Maintenance':
      case 'Out of Service':
        return 'bg-red-500 text-white';
      case 'Decommissioned':
        return 'bg-gray-500 text-white';
      case 'Auctioned':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'Operational':
        return 'Serviceable';
      case 'Under Maintenance':
      case 'Out of Service':
        return 'Unserviceable';
      default:
        return status;
    }
  };

  // Handle equipment added
  const handleEquipmentAdded = (newEquipment) => {
    setEquipment(prev => [newEquipment, ...prev]);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading equipment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded max-w-md text-center">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Equipment Inventory</h1>
          
          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0">
              <input
                type="text"
                placeholder="Search by name, serial, model, brand, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg 
                className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
            
            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            {/* Add Equipment Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Equipment
            </button>
          </div>
        </div>

        {/* Add Equipment Form */}
        {showAddForm && (
          <AddEquipment onEquipmentAdded={handleEquipmentAdded} />
        )}

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600">
          {filteredEquipment.length} equipment{filteredEquipment.length !== 1 ? 's' : ''} found
          {selectedDepartment && selectedDepartment !== 'All Departments' && ` in ${selectedDepartment}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>

        {filteredEquipment.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No equipment found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map(equip => (
              <div key={equip._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">{equip.name}</h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(equip.status)}`}>
                      {getStatusText(equip.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Serial Number:</span>
                      <span className="text-sm font-medium text-gray-900">{equip.serialNumber}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Model:</span>
                      <span className="text-sm font-medium text-gray-900">{equip.model}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Manufacturer:</span>
                      <span className="text-sm font-medium text-gray-900">{equip.manufacturer}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Department:</span>
                      <span className="text-sm font-medium text-gray-900">{equip.department}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium text-gray-900">{equip.location}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="text-sm font-medium text-gray-900">{equip.category}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Installed:</span>
                    <span className="text-gray-900">{new Date(equip.installationDate).toLocaleDateString()}</span>
                  </div>
                  {equip.warrantyExpiry && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Warranty:</span>
                      <span className="text-gray-900">{new Date(equip.warrantyExpiry).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Equipment;