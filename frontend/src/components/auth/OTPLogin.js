// frontend/src/components/auth/OTPLogin.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const OTPLogin = ({ login }) => {
  const [step, setStep] = useState('serviceNumber'); // 'serviceNumber' or 'otp'
  const [formData, setFormData] = useState({
    serviceNumber: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { serviceNumber, otp } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const requestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/auth/request-otp', { serviceNumber });
      setStep('otp');
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
          <p className="text-gray-600">BMED Staff Login</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {step === 'serviceNumber' ? (
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
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <div className="text-center">
              <p className="text-sm text-gray-600 mt-4">
                Don't have an account?{' '}
                <Link to="/register" className="text-teal-600 hover:text-teal-700">
                  Register
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
                onChange={onChange}
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
                onClick={() => setStep('serviceNumber')}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                Change Service Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OTPLogin;