import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import API from '../../services/api';
import { Building2, Users, Layers, ShoppingCart, IndianRupee, Plus, ArrowRight, CheckCircle, Package } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const FPODashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/fpo/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load FPO dashboard:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex"><Sidebar /><div className="flex-1"><Loading /></div></div>;

  const chartData = (data?.inventory || []).map((inv) => ({
    name: inv.cropName,
    stock: inv.totalQuantity,
    available: inv.availableQuantity,
    reserved: inv.reservedQuantity || 0,
  }));

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        {/* Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white p-6 rounded-3xl shadow-md">
          <div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block">FPO Hub</span>
            <h1 className="text-2xl font-black">FPO Producer Organization Center 🏢</h1>
            <p className="text-xs text-slate-300 mt-1">Aggregate produce from multiple farmers & service large bulk buyer contracts.</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/fpo/procurement"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow inline-flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Post Procurement Req
            </Link>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Farmers Connected</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900">{data?.farmersConnected || 0}</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"><Users className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Aggregated Stock</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-agri-800">{data?.totalAggregatedQty?.toLocaleString() || 0} kg</span>
              <div className="p-2 bg-agri-100 text-agri-800 rounded-xl"><Layers className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Active Procurements</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-600">{data?.procurementCount || 0}</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl"><Building2 className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Completed Orders</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-blue-600">{data?.completedOrders || 0}</span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl"><CheckCircle className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Revenue</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-emerald-800">₹{data?.revenue?.toLocaleString('en-IN') || '0'}</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"><IndianRupee className="w-5 h-5" /></div>
            </div>
          </div>
        </div>

        {/* Aggregated Stock Breakdown & Multi-Farmer Suppliers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-agri-600" /> FPO Consolidated Inventory Stock (kg)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="available" fill="#16a34a" name="Available Stock" />
                  <Bar dataKey="reserved" fill="#f59e0b" name="Reserved for Buyer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Business Logic Demonstration Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Multi-Farmer Aggregation Example</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Tomato Stock Consolidation:</span>
              <div className="flex justify-between text-slate-600"><span>Farmer A (Ramesh)</span><span className="font-bold">1,000 kg</span></div>
              <div className="flex justify-between text-slate-600"><span>Farmer B (Suresh)</span><span className="font-bold">2,000 kg</span></div>
              <div className="flex justify-between text-slate-600"><span>Farmer C (Basavaraj)</span><span className="font-bold">1,500 kg</span></div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-agri-800 text-sm">
                <span>Total FPO Inventory</span>
                <span>4,500 kg</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              When farmers accept FPO purchase requests, produce quantities are automatically merged into single bulk shipments for large buyers.
            </p>
          </div>
        </div>

        {/* FPO Aggregated Stock Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Aggregated Crop Inventory</h3>
            <Link to="/fpo/inventory" className="text-xs font-bold text-amber-700 hover:underline">Manage Inventory</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3">Crop</th>
                  <th className="p-3">Variety</th>
                  <th className="p-3">Total Volume</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Reserved</th>
                  <th className="p-3">Supplying Farmers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.inventory && data.inventory.length > 0 ? (
                  data.inventory.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{inv.cropName}</td>
                      <td className="p-3 text-slate-600">{inv.variety}</td>
                      <td className="p-3 font-bold text-slate-800">{inv.totalQuantity?.toLocaleString()} {inv.unit}</td>
                      <td className="p-3 font-bold text-agri-800">{inv.availableQuantity?.toLocaleString()} {inv.unit}</td>
                      <td className="p-3 font-semibold text-amber-700">{inv.reservedQuantity?.toLocaleString() || 0} {inv.unit}</td>
                      <td className="p-3 text-slate-600">{inv.sourceFarmers?.length || 1} Farmers</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400">No inventory aggregated yet. Accept farmer produce or post procurement requests to start.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FPODashboard;
