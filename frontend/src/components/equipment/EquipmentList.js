// frontend/src/components/equipment/EquipmentList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EquipmentList = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to get status color based on equipment status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Serviceable':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Under Maintenance':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Unserviceable':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'Decommissioned':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'Auctioned':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
  };

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        // Add authorization header with token from localStorage
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        const response = await axios.get('http://localhost:5000/api/equipment', config);
        setEquipment(response.data.equipment || []);
      } catch (err) {
        setError('Failed to fetch equipment data');
        console.error('Error fetching equipment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    
    // Sort equipment by name for consistent printing
    const sortedEquipment = [...equipment].sort((a, b) => a.name.localeCompare(b.name));
    
    const equipmentRows = sortedEquipment.map(equip => `
      <tr class="border-b border-slate-200">
        <td class="py-3 px-4 text-slate-700">${equip.name || 'N/A'}</td>
        <td class="py-3 px-4 text-slate-700">${equip.serialNumber || 'N/A'}</td>
        <td class="py-3 px-4 text-slate-700">${equip.model || 'N/A'}</td>
        <td class="py-3 px-4 text-slate-700">${equip.manufacturer || 'N/A'}</td>
        <td class="py-3 px-4 text-slate-700">${equip.department || 'N/A'}</td>
        <td class="py-3 px-4 text-slate-700">${equip.location || 'N/A'}</td>
        <td class="py-3 px-4 text-slate-700">${equip.category || 'N/A'}</td>
        <td class="py-3 px-4">
          <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(equip.status)}">
            ${equip.status || 'Unknown'}
          </span>
        </td>
        <td class="py-3 px-4 text-slate-700">${equip.installationDate ? new Date(equip.installationDate).toLocaleDateString() : 'N/A'}</td>
        <td class="py-3 px-4 text-slate-700">${equip.warrantyExpiry ? new Date(equip.warrantyExpiry).toLocaleDateString() : 'N/A'}</td>
      </tr>
    `).join('');

    const printContent = `
      <html>
        <head>
          <title>Equipment Inventory - Servix CMMS</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 1200px;
              margin: 0 auto;
              padding: 40px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 5px;
            }
            .title {
              font-size: 24px;
              color: #1f2937;
              margin: 10px 0;
            }
            .date {
              color: #6b7280;
              font-size: 14px;
            }
            .summary {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-around;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-value {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
            }
            .table-container {
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: 600;
              text-align: left;
              padding: 12px 4px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 8px 4px;
              font-size: 12px;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              color: #9ca3af;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">SERVIX CMMS</div>
            <div class="title">Equipment Inventory</div>
            <div class="date">Printed on: ${currentDate}</div>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Equipment</div>
              <div class="summary-value">${equipment.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Serviceable</div>
              <div class="summary-value">${equipment.filter(e => e.status === 'Serviceable').length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Under Maintenance</div>
              <div class="summary-value">${equipment.filter(e => e.status === 'Under Maintenance').length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Unserviceable</div>
              <div class="summary-value">${equipment.filter(e => e.status === 'Unserviceable').length}</div>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Equipment Name</th>
                  <th>Serial Number</th>
                  <th>Model</th>
                  <th>Manufacturer</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Installation Date</th>
                  <th>Warranty Expiry</th>
                </tr>
              </thead>
              <tbody>
                ${equipmentRows}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            Servix CMMS - Comprehensive Maintenance Management System
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-xl text-slate-600">Loading equipment inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Equipment</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalEquipment = equipment.length;
  const serviceableCount = equipment.filter(e => e.status === 'Serviceable').length;
  const maintenanceCount = equipment.filter(e => e.status === 'Under Maintenance').length;
  const unserviceableCount = equipment.filter(e => e.status === 'Unserviceable').length;
  const decommissionedCount = equipment.filter(e => e.status === 'Decommissioned').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Equipment Inventory
          </h1>
          <p className="text-slate-600 text-lg">
            Comprehensive list of all equipment in the system
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{totalEquipment}</div>
            <div className="text-slate-600 font-medium">Total Equipment</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{serviceableCount}</div>
            <div className="text-slate-600 font-medium">Serviceable</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{maintenanceCount}</div>
            <div className="text-slate-600 font-medium">Under Maintenance</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{unserviceableCount}</div>
            <div className="text-slate-600 font-medium">Unserviceable</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-gray-600 mb-2">{decommissionedCount}</div>
            <div className="text-slate-600 font-medium">Decommissioned</div>
          </div>
        </div>

        {/* Print Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handlePrint}
            className="flex items-center px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Inventory
          </button>
        </div>

        {/* Equipment Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Equipment Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Serial Number</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Model</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Manufacturer</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Department</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Location</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Category</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Installation Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Warranty Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {equipment.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No equipment found</p>
                      <p className="text-slate-400">Add new equipment to get started</p>
                    </td>
                  </tr>
                ) : (
                  equipment.map((equip) => (
                    <tr key={equip._id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="py-4 px-6 text-slate-700 font-medium">{equip.name || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-700">{equip.serialNumber || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-700">{equip.model || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-700">{equip.manufacturer || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-700">{equip.department || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-700">{equip.location || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-700">{equip.category || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(equip.status)}`}>
                          {equip.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {equip.installationDate ? new Date(equip.installationDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {equip.warrantyExpiry ? new Date(equip.warrantyExpiry).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 -left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 -right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  );
};

export default EquipmentList;