// frontend/src/components/equipment/Equipment.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Print CSS styles
const printStyles = `
@media print {
  /* Hide non-print elements */
  .no-print, 
  .hidden-print, 
  .flex > button, 
  .mb-6 > div > input,
  .mb-6 > div > select {
    display: none !important;
  }
  
  /* Ensure full width for print */
  .print-container, .container, .bg-white, table {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
  }
  
  /* Style for print */
  body {
    background: white !important;
    font-family: Arial, sans-serif;
  }
  
  table {
    width: 100% !important;
    border-collapse: collapse;
    margin: 0;
    padding: 0;
  }
  
  th, td {
    border: 1px solid #000 !important;
    padding: 8px !important;
    font-size: 12px !important;
    text-align: left;
  }
  
  th {
    background-color: #f3f4f6 !important;
    font-weight: bold;
  }
  
  /* Header styling */
  h1, h2, h3 {
    color: #1f2937 !important;
    page-break-after: avoid;
  }
  
  /* Ensure content stays together */
  tr {
    page-break-inside: avoid;
  }
  
  /* Footer */
  @page {
    margin: 0.5in;
    size: letter;
  }
  
  /* Add page breaks for better printing */
  .page-break {
    page-break-before: always;
  }
}

/* Print-only elements */
.print-only {
  display: none !important;
}

/* Show elements only when printing */
@media print {
  .print-only {
    display: block !important;
  }
}
`;

const Equipment = ({ user, setCurrentPage }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [printMode, setPrintMode] = useState(false);

  // Set current page
  useEffect(() => {
    if (setCurrentPage && typeof setCurrentPage === 'function') {
      setCurrentPage('equipment');
    }
  }, [setCurrentPage]);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const endpoint = selectedDepartment 
          ? `/equipment/department/${selectedDepartment}`
          : '/equipment';
          
        const res = await axios.get(endpoint);
        setEquipment(res.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch equipment');
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [selectedDepartment]);

  const handleSearch = e => {
    setSearchTerm(e.target.value);
  };

  const handleDepartmentChange = e => {
    setSelectedDepartment(e.target.value);
  };

  const handleStatusChange = async (equipmentId, newStatus, notes) => {
    try {
      await axios.put(`/equipment/${equipmentId}`, {
        status: newStatus,
        statusChangeNotes: notes
      });
      
      // Refresh the equipment list
      const endpoint = selectedDepartment 
        ? `/equipment/department/${selectedDepartment}`
        : '/equipment';
        
      const res = await axios.get(endpoint);
      setEquipment(res.data.data);
    } catch (err) {
      setError('Failed to update equipment status');
    }
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const filteredEquipment = equipment.filter(eq =>
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={printMode ? 'print-container' : ''}>
      {/* Inject print styles */}
      <style>{printStyles}</style>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Equipment Inventory</h1>
        <div className="flex space-x-4">
          <Link to="/add-equipment" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors no-print">
            + Add Equipment
          </Link>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors no-print"
          >
            Print List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <input
            type="text"
            placeholder="Search by name, brand, model, or serial number..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            <option value="TSEU">TSEU</option>
            <option value="MEU">MEU</option>
            <option value="PEU">PEU</option>
            <option value="DEPARTMENT OF ANATOMICAL PATHOLOGY">DEPARTMENT OF ANATOMICAL PATHOLOGY</option>
            <option value="IT OFFICE">IT OFFICE</option>
            <option value="SIMANGO">SIMANGO</option>
            <option value="ANAESTHESIA CLINIC">ANAESTHESIA CLINIC</option>
            <option value="HAEMATOLOGY DAYCARE CLINIC">HAEMATOLOGY DAYCARE CLINIC</option>
            <option value="TAMAKLO">TAMAKLO</option>
            <option value="ANOFF">ANOFF</option>
            <option value="CTU">CTU</option>
            <option value="ICU">ICU</option>
            <option value="DIALYSIS">DIALYSIS</option>
            <option value="MAIN THEATRE">MAIN THEATRE</option>
            <option value="CSSD">CSSD</option>
            <option value="DESPITE">DESPITE</option>
            <option value="ALLIED SURGERY">ALLIED SURGERY</option>
            <option value="EASMON">EASMON</option>
            <option value="NEURO SURGERY">NEURO SURGERY</option>
            <option value="YEBUAH WARD">YEBUAH WARD</option>
            <option value="YAA ASANTEWAA">YAA ASANTEWAA</option>
            <option value="JAMES COLE">JAMES COLE</option>
            <option value="BANDOH">BANDOH</option>
            <option value="GHANDI">GHANDI</option>
            <option value="OPOKU">OPOKU</option>
            <option value="GEU">GEU</option>
            <option value="DEBRAH WARD">DEBRAH WARD</option>
            <option value="BLOOD BANK">BLOOD BANK</option>
            <option value="MOPD">MOPD</option>
            <option value="SOPD">SOPD</option>
            <option value="POPD">POPD</option>
            <option value="FOPD">FOPD</option>
            <option value="DENTAL">DENTAL</option>
            <option value="PUBLIC HEALTH">PUBLIC HEALTH</option>
            <option value="POLYCLINIC">POLYCLINIC</option>
            <option value="ENT">ENT</option>
            <option value="OPTHAMOLOGY">OPTHAMOLOGY</option>
            <option value="PATHOLOGY DEPARTMENT (LAB)">PATHOLOGY DEPARTMENT (LAB)</option>
            <option value="RADIOLOGY DEPARTMENT">RADIOLOGY DEPARTMENT</option>
            <option value="PHYSIOTHERAPY">PHYSIOTHERAPY</option>
            <option value="37 CHEMIST">37 CHEMIST</option>
            <option value="MSED">MSED</option>
            <option value="DIETETICS DEPARTMENT">DIETETICS DEPARTMENT</option>
            <option value="BIRTH AND DEATH">BIRTH AND DEATH</option>
            <option value="LAUNDRY">LAUNDRY</option>
            <option value="BMED">BMED</option>
            <option value="PHARMACY DIVISION">PHARMACY DIVISION</option>
            <option value="MATERNITY THEATRE">MATERNITY THEATRE</option>
            <option value="NICU">NICU</option>
            <option value="LABOUR">LABOUR</option>
            <option value="MILITARY POLYCLINIC">MILITARY POLYCLINIC</option>
            <option value="OXYGEN PLANT">OXYGEN PLANT</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && filteredEquipment.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No equipment found.</p>
        </div>
      )}

      {!loading && !error && filteredEquipment.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand/Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID/SERIAL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEquipment.map(eq => (
                <EquipmentRow 
                  key={eq._id} 
                  equipment={eq} 
                  user={user}
                  onStatusChange={handleStatusChange}
                  printMode={printMode}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Separate component for equipment row to handle status changes
const EquipmentRow = ({ equipment, user, onStatusChange, printMode }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  const handleChangeStatus = () => {
    if (newStatus && newStatus !== equipment.status) {
      onStatusChange(equipment._id, newStatus, notes);
      setShowStatusModal(false);
      setNewStatus('');
      setNotes('');
    }
  };

  return (
    <>
      <tr key={equipment._id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{equipment.name}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{equipment.brand} {equipment.model}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{equipment.serialNumber}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            equipment.status === 'Serviceable' ? 'bg-green-100 text-green-800' :
            equipment.status === 'Unserviceable' ? 'bg-red-100 text-red-800' :
            equipment.status === 'Decommissioned' ? 'bg-gray-100 text-gray-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {equipment.status}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipment.department}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          {!printMode && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="text-blue-600 hover:text-blue-900"
            >
              Change Status
            </button>
          )}
        </td>
      </tr>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Change Equipment Status</h3>
            <p className="mb-4">Current status: <strong>{equipment.status}</strong></p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select new status</option>
                <option value="Serviceable">Serviceable</option>
                <option value="Unserviceable">Unserviceable</option>
                <option value="Decommissioned">Decommissioned</option>
                <option value="Auctioned">Auctioned</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Reason for status change"
                rows="3"
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowStatusModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeStatus}
                disabled={!newStatus || newStatus === equipment.status}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Equipment;