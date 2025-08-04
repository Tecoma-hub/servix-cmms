// frontend/src/config/api.js (create this file if it doesn't exist)
const API_BASE_URL = 'https://www.medtrackcmms37.online/api ';

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};