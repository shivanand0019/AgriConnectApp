import API from './api';

export const fetchOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await API.get(`/orders?${params}`);
  return res.data;
};

export const fetchOrderById = async (id) => {
  const res = await API.get(`/orders/${id}`);
  return res.data;
};

export const createOrder = async (orderData) => {
  const res = await API.post('/orders', orderData);
  return res.data;
};

export const updateOrderStatus = async (id, statusData) => {
  const res = await API.put(`/orders/${id}/status`, statusData);
  return res.data;
};
