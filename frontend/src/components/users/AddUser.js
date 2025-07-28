// frontend/src/components/users/AddUser.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddUser = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Technician',
    department: 'TSEU',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { name, email, password, role, department, phone } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/users', formData);
      console.log('User created:', res.data);
      alert('User created successfully!');
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New User</h1>
          <p className="text-gray-600">Create user accounts for your team</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter email address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Create password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              name="role"
              value={role}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="Technician">Technician</option>
              <option value="Engineer">Engineer</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
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
              <option value="OXYGEN PLANT">OXYGEN PLANT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="text"
              name="phone"
              value={phone}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating User...' : 'Create User'}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Back to Users
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;