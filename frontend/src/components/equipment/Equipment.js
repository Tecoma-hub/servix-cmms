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
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3 items per row on large screens

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

  // Get unique departments and statuses for dropdowns
  const departments = useMemo(() => {
    if (!equipment || equipment.length === 0) return ['All Departments'];
    const uniqueDepartments = [...new Set(equipment.map(item => item.department))];
    return ['All Departments', ...uniqueDepartments.sort()];
  }, [equipment]);

  const statuses = useMemo(() => {
    if (!equipment || equipment.length === 0) return ['All Statuses'];
    const uniqueStatuses = [...new Set(equipment.map(item => item.status))];
    return ['All Statuses', ...uniqueStatuses.sort()];
  }, [equipment]);

  // Filter equipment based on search term, selected department, and selected status
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search across multiple fields
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchLower) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(searchLower)) ||
        (item.model && item.model.toLowerCase().includes(searchLower)) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower)) ||
        (item.location && item.location.toLowerCase().includes(searchLower)) ||
        item.status.toLowerCase().includes(searchLower);
      
      const matchesDepartment = !selectedDepartment || 
                               selectedDepartment === 'All Departments' || 
                               item.department === selectedDepartment;
      
      const matchesStatus = !selectedStatus || 
                           selectedStatus === 'All Statuses' || 
                           item.status === selectedStatus;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [equipment, searchTerm, selectedDepartment, selectedStatus]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  
  // Get current page equipment
  const currentEquipment = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEquipment.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEquipment, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedStatus]);

  // Get equipment status color with requested color scheme
  const getStatusColor = (status) => {
    switch (status) {
      case 'Serviceable':
        return 'bg-green-600 text-white border border-green-700';
      case 'Unserviceable':
        return 'bg-red-600 text-white border border-red-700';
      case 'Decommissioned':
        return 'bg-gray-600 text-white border border-gray-700';
      case 'Auctioned':
        return 'bg-purple-600 text-white border border-purple-700';
      default:
        return 'bg-yellow-600 text-white border border-yellow-700';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'Under Maintenance':
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

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page, last page, current page, and two pages on either side
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = maxVisiblePages;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxVisiblePages + 1;
      }
      
      // Add pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis and first page if needed
      if (startPage > 1) {
        pageNumbers.unshift('...');
        pageNumbers.unshift(1);
      }
      
      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-xl text-slate-600">Loading equipment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 px-8 py-6 rounded-2xl max-w-md text-center">
            <div className="flex items-start justify-center">
              <svg className="w-6 h-6 mt-0.5 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-green-500 rounded-full mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-800">Equipment Inventory</h1>
          <p className="text-slate-600 text-lg">Comprehensive list of all medical equipment in the system</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 min-w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, serial, model, brand, category, location, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 placeholder-slate-400"
                />
              </div>

              {/* Department Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 bg-white"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              {/* Status Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 bg-white"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {showAddForm ? 'Cancel' : 'Add Equipment'}
            </button>
          </div>
        </div>

        {/* Add Equipment Form */}
        {showAddForm && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <AddEquipment onEquipmentAdded={handleEquipmentAdded} />
          </div>
        )}

        {/* Results Info */}
        <div className="mb-6 text-sm text-slate-600 bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <span className="font-medium">{filteredEquipment.length}</span> equipment{filteredEquipment.length !== 1 ? 's' : ''} found
              {selectedDepartment && selectedDepartment !== 'All Departments' && (
                <span className="ml-1">in <span className="font-medium">{selectedDepartment}</span></span>
              )}
              {selectedStatus && selectedStatus !== 'All Statuses' && (
                <span className="ml-1">with status <span className="font-medium">{selectedStatus}</span></span>
              )}
              {searchTerm && (
                <span className="ml-1">matching "<span className="font-medium">{searchTerm}</span>"</span>
              )}
            </div>
            {filteredEquipment.length > 0 && (
              <div className="text-xs text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredEquipment.length)} of {filteredEquipment.length} total
              </div>
            )}
          </div>
        </div>

        {/* Equipment Grid */}
        {filteredEquipment.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-slate-800">No equipment found</h3>
            <p className="mt-2 text-slate-600">Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentEquipment.map(equip => (
              <div key={equip._id} className="bg-white shadow-lg rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-slate-800">{equip.name}</h2>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(equip.status)}`}>
                      {getStatusText(equip.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Serial Number:</span>
                      <span className="text-sm font-medium text-slate-800">{equip.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Model:</span>
                      <span className="text-sm font-medium text-slate-800">{equip.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Manufacturer:</span>
                      <span className="text-sm font-medium text-slate-800">{equip.manufacturer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Department:</span>
                      <span className="text-sm font-medium text-slate-800">{equip.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Location:</span>
                      <span className="text-sm font-medium text-slate-800">{equip.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Category:</span>
                      <span className="text-sm font-medium text-slate-800">{equip.category}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Installed:</span>
                    <span className="font-medium">{new Date(equip.installationDate).toLocaleDateString()}</span>
                  </div>
                  {equip.warrantyExpiry && (
                    <div className="flex justify-between text-sm text-slate-600 mt-2">
                      <span>Warranty Expiry:</span>
                      <span className="font-medium">{new Date(equip.warrantyExpiry).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0 text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </div>
            
            <nav className="inline-flex rounded-xl shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-l-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                  currentPage === 1 ? 'bg-slate-100 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-6-6a2 2 0 00-2-2v6a2 2 0 002 2h6zM3 19a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6z" />
                </svg>
              </button>
              
              {getPageNumbers().map((pageNumber, index) => (
                <button
                  key={index}
                  onClick={() => typeof pageNumber === 'number' && handlePageChange(pageNumber)}
                  className={`px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200 ${
                    typeof pageNumber === 'number' && currentPage === pageNumber
                      ? 'bg-blue-600 text-white border-blue-600'
                      : ''
                  } ${
                    typeof pageNumber === 'string'
                      ? 'bg-white text-slate-500 cursor-default hover:bg-white'
                      : ''
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-r-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                  currentPage === totalPages ? 'bg-slate-100 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2V6" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Equipment;