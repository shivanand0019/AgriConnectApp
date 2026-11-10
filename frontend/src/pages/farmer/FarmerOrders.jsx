import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import OrderCard from '../../components/OrderCard';
import { fetchOrders, updateOrderStatus } from '../../services/orderService';
import { ShoppingCart, Filter } from 'lucide-react';

const FarmerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders({ status: statusFilter });
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      loadOrders();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Purchase Orders</h1>
              <p className="text-xs text-slate-500">Manage incoming buyer and FPO purchase orders</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Loading text="Loading purchase orders..." />
        ) : (
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((ord) => (
                <OrderCard
                  key={ord._id}
                  order={ord}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))
            ) : (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                No orders found matching the criteria.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FarmerOrders;
