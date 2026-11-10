import API from './api';

export const fetchProcurements = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await API.get(`/procurement?${params}`);
  return res.data;
};

export const fetchProcurementById = async (id) => {
  const res = await API.get(`/procurement/${id}`);
  return res.data;
};

export const createProcurement = async (data) => {
  const res = await API.post('/procurement', data);
  return res.data;
};

export const respondToProcurement = async (id, responseData) => {
  const res = await API.post(`/procurement/${id}/respond`, responseData);
  return res.data;
};

export const handleResponseStatus = async (id, data) => {
  const res = await API.put(`/procurement/${id}/accept-response`, data);
  return res.data;
};
