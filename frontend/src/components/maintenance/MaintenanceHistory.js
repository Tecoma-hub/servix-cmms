// frontend/src/components/maintenance/MaintenanceHistory.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const MaintenanceHistory = ({ equipmentId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    problemDescription: '',
    resolutionSummary: '',
    dateReported: '',
    dateCompleted: '',
    sparePartsUsed: [],
    engineers: [],
    technicians: []
  });

  const params = useParams();
  const equipmentIdToUse = equipmentId || params.id;

  useEffect(() => {
    fetchMaintenanceHistory();
  }, [equipmentIdToUse]);

  const fetchMaintenanceHistory = async () => {
    try {
      const res = await axios.get(`/maintenance-history/${equipmentIdToUse}`);
      setHistory(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch maintenance history');
    } finally {
      setLoading(false);
    }
  };

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSparePart = () => {
    setFormData({
      ...formData,
      sparePartsUsed: [...formData.sparePartsUsed, { partId: '', quantity: 1 }]
    });
  };

  const removeSparePart = (index) => {
    const newSpareParts = formData.sparePartsUsed.filter((_, i) => i !== index);
    setFormData({ ...formData, sparePartsUsed: newSpareParts });
  };

  const updateSparePart = (index, field, value) => {
    const newSpareParts = [...formData.sparePartsUsed];
    newSpareParts[index][field] = value;
    setFormData({ ...formData, sparePartsUsed: newSpareParts });
  };

  const addPersonnel = (type) => {
    const field = type === 'engineer' ? 'engineers' : 'technicians';
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };

  const removePersonnel = (type, index) => {
    const field = type === 'engineer' ? 'engineers' : 'technicians';
    const newPersonnel = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newPersonnel });
  };

  const updatePersonnel = (type, index, value) => {
    const field = type === 'engineer' ? 'engineers' : 'technicians';
    const newPersonnel = [...formData[field]];
    newPersonnel[index] = value;
    setFormData({ ...formData, [field]: newPersonnel });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/maintenance-history', {
        ...formData,
        equipmentId: equipmentIdToUse
      });
      
      // Add new record to history
      setHistory([res.data.data, ...history]);
      setShowForm(false);
      setFormData({
        problemDescription: '',
        resolutionSummary: '',
        dateReported: '',
        dateCompleted: '',
        sparePartsUsed: [],
        engineers: [],
        technicians: []
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save maintenance record');
    }
  };

  if (loading) return <div>Loading maintenance history...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Maintenance History</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Maintenance Report'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Add Maintenance Report</h3>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Description
              </label>
              <textarea
                name="problemDescription"
                value={formData.problemDescription}
                onChange={onChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Summary
              </label>
              <textarea
                name="resolutionSummary"
                value={formData.resolutionSummary}
                onChange={onChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Reported
                </label>
                <input
                  type="date"
                  name="dateReported"
                  value={formData.dateReported}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Completed
                </label>
                <input
                  type="date"
                  name="dateCompleted"
                  value={formData.dateCompleted}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Spare Parts Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Spare Parts Used
                </label>
                <button
                  type="button"
                  onClick={addSparePart}
                  className="text-blue-600 text-sm hover:text-blue-800"
                >
                  + Add Part
                </button>
              </div>
              
              {formData.sparePartsUsed.map((part, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Part ID"
                    value={part.partId}
                    onChange={(e) => updateSparePart(index, 'partId', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={part.quantity}
                    onChange={(e) => updateSparePart(index, 'quantity', parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeSparePart(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Engineers Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Engineers
                </label>
                <button
                  type="button"
                  onClick={() => addPersonnel('engineer')}
                  className="text-blue-600 text-sm hover:text-blue-800"
                >
                  + Add Engineer
                </button>
              </div>
              
              {formData.engineers.map((engineer, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Engineer ID or Name"
                    value={engineer}
                    onChange={(e) => updatePersonnel('engineer', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removePersonnel('engineer', index)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Technicians Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Technicians
                </label>
                <button
                  type="button"
                  onClick={() => addPersonnel('technician')}
                  className="text-blue-600 text-sm hover:text-blue-800"
                >
                  + Add Technician
                </button>
              </div>
              
              {formData.technicians.map((technician, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Technician ID or Name"
                    value={technician}
                    onChange={(e) => updatePersonnel('technician', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removePersonnel('technician', index)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Report
              </button>
            </div>
          </form>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No maintenance history found for this equipment.
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(record => (
            <div key={record._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {record.problemDescription}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Reported: {new Date(record.dateReported).toLocaleDateString()} | 
                    Completed: {new Date(record.dateCompleted).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {record.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Resolution</h4>
                  <p className="text-gray-600 text-sm">{record.resolutionSummary}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Team</h4>
                  <div className="space-y-1">
                    {record.engineers.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-blue-600">Engineers:</span>
                        <div className="text-sm text-gray-600">
                          {record.engineers.map(e => e.name).join(', ')}
                        </div>
                      </div>
                    )}
                    {record.technicians.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-green-600">Technicians:</span>
                        <div className="text-sm text-gray-600">
                          {record.technicians.map(t => t.name).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {record.sparePartsUsed.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Spare Parts Used</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {record.sparePartsUsed.map((part, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{part.partName}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{part.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">${part.unitPrice}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              ${(part.quantity * part.unitPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-medium">
                          <td colSpan="3" className="px-4 py-2 text-right">Total Cost:</td>
                          <td className="px-4 py-2">${record.totalCost.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {record.taskId && (
                <div className="mt-4">
                  <span className="text-xs font-medium text-purple-600">Task Reference:</span>
                  <div className="text-sm text-gray-600">
                    {record.taskId.title} (Priority: {record.taskId.priority})
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceHistory;