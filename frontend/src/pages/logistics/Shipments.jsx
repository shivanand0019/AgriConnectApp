import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import ShipmentCard from '../../components/ShipmentCard';
import MapView from '../../components/MapView';
import { fetchShipments, updateShipmentStatus } from '../../services/shipmentService';
import { Truck, Navigation } from 'lucide-react';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const res = await fetchShipments();
      if (res.success) {
        setShipments(res.data);
      }
    } catch (err) {
      console.error('Failed to load shipments:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await updateShipmentStatus(shipmentId, { status: newStatus });
      loadShipments();
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
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Shipments & Live Transport Marketplace</h1>
              <p className="text-xs text-slate-500">Accept requested crop shipments and advance delivery status</p>
            </div>
          </div>
        </div>

        {loading ? (
          <Loading text="Loading freight shipments..." />
        ) : (
          <div className="space-y-4">
            {shipments.length > 0 ? (
              shipments.map((ship) => (
                <ShipmentCard
                  key={ship._id}
                  shipment={ship}
                  onStatusUpdate={handleStatusUpdate}
                  showControls={true}
                />
              ))
            ) : (
              <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                No active or requested shipments found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Shipments;
