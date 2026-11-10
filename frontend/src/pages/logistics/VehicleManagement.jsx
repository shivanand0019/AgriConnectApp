import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import API from '../../services/api';
import Modal from '../../components/Modal';
import { Truck, Plus, CheckCircle, AlertCircle } from 'lucide-react';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [vehicleType, setVehicleType] = useState('Container Truck 10-Ton');
  const [registrationNumber, setRegistrationNumber] = useState(`KA-09-F-${Math.floor(1000 + Math.random() * 9000)}`);
  const [capacityTons, setCapacityTons] = useState('10');
  const [pricePerKm, setPricePerKm] = useState('35');
  const [currentCity, setCurrentCity] = useState('Mysuru');
  const [driverName, setDriverName] = useState('Ramesh Kumar');
  const [driverPhone, setDriverPhone] = useState('+91 9876543210');

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await API.get('/logistics/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await API.post('/logistics/vehicles', {
        vehicleType,
        registrationNumber,
        capacityTons: Number(capacityTons),
        pricePerKm: Number(pricePerKm),
        currentCity,
        driverName,
        driverPhone,
      });
      setShowAddModal(false);
      loadVehicles();
    } catch (err) {
      alert(err.message || 'Failed to register vehicle');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Fleet & Vehicle Management</h1>
              <p className="text-xs text-slate-500">Register trucks, set capacity & price per km for crop transport</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Register New Vehicle
          </button>
        </div>

        {loading ? (
          <Loading text="Loading fleet vehicles..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.length > 0 ? (
              vehicles.map((v) => (
                <div key={v._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{v.registrationNumber}</span>
                      <h3 className="text-base font-black text-slate-900">{v.vehicleType}</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-full">
                      Available
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payload Capacity:</span>
                      <strong className="text-slate-900 font-bold">{v.capacityTons} Tons</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rate per km:</span>
                      <strong className="text-purple-700 font-bold">₹{v.pricePerKm} / km</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Location:</span>
                      <span className="font-semibold">{v.currentCity}</span>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-slate-600 space-y-0.5">
                    <p>Driver: <strong>{v.driverName}</strong></p>
                    <p>Phone: <strong>{v.driverPhone}</strong></p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                No vehicles registered in your fleet yet. Click 'Register New Vehicle' to add trucks.
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register Logistics Vehicle"
        >
          <form className="space-y-4" onSubmit={handleAddVehicle}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="Container Truck 10-Ton">Container Truck 10-Ton</option>
                <option value="Eicher 5-Ton">Eicher 5-Ton</option>
                <option value="Pickup Van 2-Ton">Pickup Van 2-Ton</option>
                <option value="Refrigerated Truck 8-Ton">Refrigerated Truck 8-Ton</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registration Number</label>
              <input
                type="text"
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="KA-09-F-1234"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Capacity (Tons)</label>
                <input
                  type="number"
                  required
                  value={capacityTons}
                  onChange={(e) => setCapacityTons(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price per km (₹)</label>
                <input
                  type="number"
                  required
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Register Vehicle
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default VehicleManagement;
