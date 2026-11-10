import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import OrderCard from '../../components/OrderCard';
import { fetchOrders } from '../../services/orderService';
import { ShoppingCart } from 'lucide-react';

const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load buyer orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Buyer Contracts & Purchase Orders</h1>
              <p className="text-xs text-slate-500">Track your bulk orders placed with FPOs and farmers</p>
            </div>
          </div>
        </div>

        {loading ? (
          <Loading text="Loading buyer contracts..." />
        ) : (
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((ord) => (
                <OrderCard
                  key={ord._id}
                  order={ord}
                />
              ))
            ) : (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                No active buyer orders found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BuyerOrders;
