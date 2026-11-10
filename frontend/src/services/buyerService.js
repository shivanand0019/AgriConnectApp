import API from './api';

export const createBuyerDemand = async (demandData) => {
  const res = await API.post('/buyers/demand', demandData);
  return res.data;
};

export const fetchBuyerDemands = async () => {
  const res = await API.get('/buyers/demand');
  return res.data;
};
