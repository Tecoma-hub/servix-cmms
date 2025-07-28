// frontend/src/components/equipment/AddEquipment.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddEquipment = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    serialNumber: '',
    department: 'TSEU',
    status: 'Serviceable',
    location: '',
    purchaseDate: '',
    warrantyExpiry: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { 
    name, brand, model, serialNumber, department, status, 
    location, purchaseDate, warrantyExpiry 
  } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/equipment', formData);
      console.log('Equipment added:', res.data);
      alert('Equipment added successfully!');
      navigate('/equipment');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Equipment</h1>
          <p className="text-gray-600">Register equipment in the system</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Equipment name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <input
              type="text"
              name="brand"
              value={brand}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Brand name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <input
              type="text"
              name="model"
              value={model}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Model number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
            <input
              type="text"
              name="serialNumber"
              value={serialNumber}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Serial number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              name="department"
              value={department}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
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
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={status}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="Serviceable">Serviceable</option>
              <option value="Unserviceable">Unserviceable</option>
              <option value="Decommissioned">Decommissioned</option>
              <option value="Auctioned">Auctioned</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={location}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Location in facility"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
            <input
              type="date"
              name="purchaseDate"
              value={purchaseDate}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Expiry</label>
            <input
              type="date"
              name="warrantyExpiry"
              value={warrantyExpiry}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding Equipment...' : 'Add Equipment'}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/equipment')}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Back to Equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEquipment;