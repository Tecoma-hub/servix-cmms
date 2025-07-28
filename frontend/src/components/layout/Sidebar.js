// frontend/src/components/layout/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBox, faWrench, faTasks, faUser } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ currentPage }) => {
  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Servix CMMS</h1>
      </div>
      <nav>
        <ul className="space-y-2">
          <li>
            <Link
              to="/dashboard"
              className={`block py-2 px-4 rounded hover:bg-gray-700 transition-colors ${
                currentPage === 'dashboard' ? 'bg-gray-700' : ''
              }`}
            >
              <FontAwesomeIcon icon={faHome} className="mr-2" /> Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/equipment"
              className={`block py-2 px-4 rounded hover:bg-gray-700 transition-colors ${
                currentPage === 'equipment' ? 'bg-gray-700' : ''
              }`}
            >
              <FontAwesomeIcon icon={faBox} className="mr-2" /> Equipment
            </Link>
          </li>
          <li>
            <Link
              to="/maintenance"
              className={`block py-2 px-4 rounded hover:bg-gray-700 transition-colors ${
                currentPage === 'maintenance' ? 'bg-gray-700' : ''
              }`}
            >
              <FontAwesomeIcon icon={faWrench} className="mr-2" /> Maintenance
            </Link>
          </li>
          <li>
            <Link
              to="/tasks"
              className={`block py-2 px-4 rounded hover:bg-gray-700 transition-colors ${
                currentPage === 'tasks' ? 'bg-gray-700' : ''
              }`}
            >
              <FontAwesomeIcon icon={faTasks} className="mr-2" /> Tasks
            </Link>
          </li>
          <li>
            <Link
              to="/users"
              className={`block py-2 px-4 rounded hover:bg-gray-700 transition-colors ${
                currentPage === 'users' ? 'bg-gray-700' : ''
              }`}
            >
              <FontAwesomeIcon icon={faUser} className="mr-2" /> Users
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;