import API from './api';

export const fetchShipments = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await API.get(`/shipments?${params}`);
  return res.data;
};

export const fetchShipmentById = async (id) => {
  const res = await API.get(`/shipments/${id}`);
  return res.data;
};

export const createShipment = async (shipmentData) => {
  const res = await API.post('/shipments', shipmentData);
  return res.data;
};

export const updateShipmentStatus = async (id, statusData) => {
  const res = await API.put(`/shipments/${id}/status`, statusData);
  return res.data;
};
