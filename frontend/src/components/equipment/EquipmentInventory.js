import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EquipmentInventory = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/equipment');
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
    // Create a printable version of all equipment data
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    
    let equipmentRows = '';
    if (equipment.length === 0) {
      equipmentRows = '<tr><td colspan="8" class="text-center py-4 text-slate-500">No equipment found</td></tr>';
    } else {
      equipmentRows = equipment.map(eq => `
        <tr class="border-b border-slate-200">
          <td class="py-3 px-4">${eq.name || 'N/A'}</td>
          <td class="py-3 px-4">${eq.serialNumber || 'N/A'}</td>
          <td class="py-3 px-4">${eq.model || 'N/A'}</td>
          <td class="py-3 px-4">${eq.manufacturer || 'N/A'}</td>
          <td class="py-3 px-4">${eq.department || 'N/A'}</td>
          <td class="py-3 px-4">${eq.location || 'N/A'}</td>
          <td class="py-3 px-4">${eq.category || 'N/A'}</td>
          <td class="py-3 px-4">${eq.installationDate ? new Date(eq.installationDate).toLocaleDateString() : 'N/A'}</td>
        </tr>
      `).join('');
    }
    
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
            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
            }
            .stat-label {
              font-size: 14px;
              color: #6b7280;
            }
            .table-container {
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: 600;
              text-align: left;
              padding: 12px 16px;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 12px 16px;
              border-bottom: 1px solid #e2e8f0;
            }
            tr:hover {
              background-color: #f8fafc;
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
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${equipment.length}</div>
              <div class="stat-label">Total Equipment</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${equipment.filter(eq => eq.status === 'Serviceable').length}</div>
              <div class="stat-label">Serviceable</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${equipment.filter(eq => eq.status === 'Under Maintenance').length}</div>
              <div class="stat-label">Under Maintenance</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${equipment.filter(eq => eq.status === 'Unserviceable').length}</div>
              <div class="stat-label">Unserviceable</div>
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
                  <th>Installation Date</th>
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

  // Filter equipment based on search term
  const filteredEquipment = equipment.filter(eq => 
    eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    total: equipment.length,
    serviceable: equipment.filter(eq => eq.status === 'Serviceable').length,
    underMaintenance: equipment.filter(eq => eq.status === 'Under Maintenance').length,
    unserviceable: equipment.filter(eq => eq.status === 'Unserviceable').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Equipment Inventory
          </h1>
          <p className="text-slate-600 text-lg">
            View and manage all equipment in your organization
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium text-center">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="max-w-4xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
            <div className="text-slate-600 font-medium">Total Equipment</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.serviceable}</div>
            <div className="text-slate-600 font-medium">Serviceable</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.underMaintenance}</div>
            <div className="text-slate-600 font-medium">Under Maintenance</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{stats.unserviceable}</div>
            <div className="text-slate-600 font-medium">Unserviceable</div>
          </div>
        </div>

        {/* Search and Print Controls */}
        <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 placeholder-slate-400"
            />
            <svg 
              className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Inventory
          </button>
        </div>

        {/* Equipment Table */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <span className="ml-3 text-slate-600">Loading equipment data...</span>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-xl font-medium text-slate-700 mb-2">No equipment found</h3>
              <p className="text-slate-500">Try adjusting your search or add new equipment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Equipment Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Serial Number</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Model</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Manufacturer</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Department</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Location</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Category</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Installation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEquipment.map((eq) => (
                    <tr key={eq._id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="py-4 px-6 font-medium text-slate-800">{eq.name}</td>
                      <td className="py-4 px-6 text-slate-600">{eq.serialNumber}</td>
                      <td className="py-4 px-6 text-slate-600">{eq.model}</td>
                      <td className="py-4 px-6 text-slate-600">{eq.manufacturer}</td>
                      <td className="py-4 px-6 text-slate-600">{eq.department}</td>
                      <td className="py-4 px-6 text-slate-600">{eq.location}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          eq.category === 'Diagnostic' ? 'bg-blue-100 text-blue-800' :
                          eq.category === 'Therapeutic' ? 'bg-green-100 text-green-800' :
                          eq.category === 'Monitoring' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {eq.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {eq.installationDate ? new Date(eq.installationDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 -left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 -right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  );
};

export default EquipmentInventory;