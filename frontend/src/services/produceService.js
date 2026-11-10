import API from './api';

export const fetchProduces = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await API.get(`/produce?${params}`);
  return res.data;
};

export const fetchProduceById = async (id) => {
  const res = await API.get(`/produce/${id}`);
  return res.data;
};

export const createProduce = async (produceData) => {
  const res = await API.post('/produce', produceData);
  return res.data;
};

export const updateProduce = async (id, data) => {
  const res = await API.put(`/produce/${id}`, data);
  return res.data;
};

export const deleteProduce = async (id) => {
  const res = await API.delete(`/produce/${id}`);
  return res.data;
};
