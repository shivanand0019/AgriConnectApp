import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import ShipmentCard from '../../components/ShipmentCard';
import MapView from '../../components/MapView';
import API from '../../services/api';
import { updateShipmentStatus } from '../../services/shipmentService';
import { Truck, Navigation, CheckCircle, IndianRupee, Plus } from 'lucide-react';

const LogisticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await API.get('/logistics/dashboard');
      if (res.data.success) {
        setData(res.data.data);
        if (res.data.data.recentShipments && res.data.data.recentShipments.length > 0) {
          setSelectedShipment(res.data.data.recentShipments[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load logistics dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await updateShipmentStatus(shipmentId, { status: newStatus });
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  if (loading) return <div className="flex"><Sidebar /><div className="flex-1"><Loading /></div></div>;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        {/* Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-purple-800 to-slate-900 text-white p-6 rounded-3xl shadow-md">
          <div>
            <span className="text-xs font-bold text-purple-300 uppercase tracking-widest block">Logistics Command Center</span>
            <h1 className="text-2xl font-black">Transport & Fleet Operations 🚚</h1>
            <p className="text-xs text-slate-300 mt-1">Accept crop shipment requests, assign fleet trucks & update GPS transport logs.</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Fleet Vehicles</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900">{data?.totalVehicles || 0}</span>
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl"><Truck className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Active In-Transit</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-600">{data?.activeShipments || 0}</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl"><Navigation className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Completed Deliveries</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-600">{data?.completedShipments || 0}</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"><CheckCircle className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Freight Revenue</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-purple-900">₹{data?.earnings?.toLocaleString('en-IN') || '0'}</span>
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl"><IndianRupee className="w-5 h-5" /></div>
            </div>
          </div>
        </div>

        {/* Live Shipment Tracking & Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-purple-600" /> Interactive Route & Live GPS Map
            </h3>

            <MapView
              pickup={{ lat: 12.2958, lng: 76.6394, title: selectedShipment?.pickupLocation?.city || 'Mysuru APMC' }}
              delivery={{ lat: 12.9716, lng: 77.5946, title: selectedShipment?.deliveryLocation?.city || 'Bengaluru Market' }}
              height="340px"
            />
          </div>

          {/* Open Marketplace Requests */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Open Shipment Requests</h3>
            <div className="space-y-3">
              {data?.openMarketplaceRequests && data.openMarketplaceRequests.length > 0 ? (
                data.openMarketplaceRequests.map((ship) => (
                  <div key={ship._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{ship.shipmentNumber}</span>
                      <span className="text-purple-700">₹{ship.totalCost}</span>
                    </div>
                    <p className="text-slate-600">
                      Route: <strong>{ship.pickupLocation?.city} $\rightarrow$ {ship.deliveryLocation?.city}</strong> ({ship.distanceKm} km)
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Cargo: {ship.cargoDetails?.cropName} ({ship.cargoDetails?.quantityKg?.toLocaleString()} kg)
                    </p>
                    <button
                      onClick={() => handleStatusUpdate(ship._id, 'ACCEPTED')}
                      className="w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Accept Shipment Request
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No unassigned shipment requests pending.</p>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Shipments Progress List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">My Active Freight Shipments</h3>
          <div className="space-y-4">
            {data?.recentShipments && data.recentShipments.length > 0 ? (
              data.recentShipments.map((ship) => (
                <ShipmentCard
                  key={ship._id}
                  shipment={ship}
                  onStatusUpdate={handleStatusUpdate}
                  showControls={true}
                />
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No active shipments. Accept a request from the open marketplace above.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LogisticsDashboard;
