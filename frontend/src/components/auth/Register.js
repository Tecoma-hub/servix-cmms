// frontend/src/components/auth/Register.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Register = ({ login }) => {
  const [formData, setFormData] = useState({
    serviceNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const { serviceNumber } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const requestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/auth/request-otp', { serviceNumber });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/auth/verify-otp', { serviceNumber, otp });
      
      if (login && res.data.token) {
        login({
          token: res.data.token,
          user: res.data.user
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Servix CMMS</h1>
          <p className="text-gray-600">BMED Staff Registration</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={requestOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Number</label>
              <input
                type="text"
                name="serviceNumber"
                value={serviceNumber}
                onChange={onChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter your service number"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Get Started'}
            </button>
            <div className="text-center">
              <p className="text-sm text-gray-600 mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-teal-600 hover:text-teal-700">
                  Login
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter 6-digit OTP"
                required
                maxLength="6"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                Change Service Number
              </button>
            </div>
          </form>
        )}
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Registration is restricted to pre-approved hospital staff only.</p>
          <p>An OTP will be sent to your registered phone number for verification.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;