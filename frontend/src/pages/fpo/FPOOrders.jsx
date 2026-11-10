import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import OrderCard from '../../components/OrderCard';
import Modal from '../../components/Modal';
import { fetchOrders, updateOrderStatus } from '../../services/orderService';
import { createShipment } from '../../services/shipmentService';
import { ShoppingCart, Truck, CheckCircle } from 'lucide-react';

const FPOOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shipmentSuccess, setShipmentSuccess] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load FPO orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      loadOrders();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleRequestShipment = async (order) => {
    setSelectedOrder(order);
    try {
      await createShipment({
        orderId: order._id,
        pickupLocation: { city: order.seller?.location?.city || 'Mysuru APMC' },
        deliveryLocation: { city: order.deliveryAddress?.city || 'Bengaluru Market' },
        distanceKm: 145,
        totalCost: 4350,
      });
      setShipmentSuccess(`Shipment request issued for Order #${order.orderNumber}! Sent to open logistics marketplace.`);
      setTimeout(() => {
        setShipmentSuccess('');
        setSelectedOrder(null);
        loadOrders();
      }, 2000);
    } catch (err) {
      alert(err.message || 'Shipment request failed');
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
              <h1 className="text-xl font-black text-slate-900">FPO Orders & Bulk Contracts</h1>
              <p className="text-xs text-slate-500">Manage farmer supply purchases and large buyer contracts</p>
            </div>
          </div>
        </div>

        {shipmentSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{shipmentSuccess}</span>
          </div>
        )}

        {loading ? (
          <Loading text="Loading FPO orders..." />
        ) : (
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((ord) => (
                <OrderCard
                  key={ord._id}
                  order={ord}
                  onStatusUpdate={handleStatusUpdate}
                  onRequestShipment={handleRequestShipment}
                />
              ))
            ) : (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                No orders recorded yet.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FPOOrders;
