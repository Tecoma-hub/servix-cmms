// frontend/src/components/equipment/EquipmentList.js
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';

const EquipmentList = ({ onSelectEquipment, selectedEquipment }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter equipment based on search term
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search across multiple fields
      return !searchTerm || 
        item.name.toLowerCase().includes(searchLower) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(searchLower)) ||
        (item.model && item.model.toLowerCase().includes(searchLower)) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower)) ||
        (item.location && item.location.toLowerCase().includes(searchLower));
    });
  }, [equipment, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="ml-3 text-gray-600">Loading equipment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Equipment List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredEquipment.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No equipment found
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredEquipment.map((equip) => (
              <li 
                key={equip._id}
                onClick={() => onSelectEquipment(equip)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                  selectedEquipment?._id === equip._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{equip.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{equip.model} • {equip.serialNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">{equip.department} • {equip.location}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    equip.status === 'Serviceable' ? 'bg-green-100 text-green-800' :
                    equip.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    equip.status === 'Unserviceable' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {equip.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
        {filteredEquipment.length} equipment{filteredEquipment.length !== 1 ? 's' : ''} found
      </div>
    </div>
  );
};

export default EquipmentList;