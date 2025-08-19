// frontend/src/api/users.js
import axios from 'axios';

const base = '/users';

export const listUsers = (params = {}) =>
  axios.get(base, { params }).then(r => r.data);

export const createUser = (payload) =>
  axios.post(base, payload).then(r => r.data);

export const getUser = (id) =>
  axios.get(`${base}/${id}`).then(r => r.data);

export const updateUser = (id, payload) =>
  axios.put(`${base}/${id}`, payload).then(r => r.data);

export const deleteUser = (id) =>
  axios.delete(`${base}/${id}`).then(r => r.data);

export const me = () => axios.get('/users/me').then(r => r.data);
export const updateMe = (payload) => axios.put('/users/me', payload).then(r => r.data);
