import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import OrderCard from '../../components/OrderCard';
import StatusBadge from '../../components/StatusBadge';
import API from '../../services/api';
import { Sprout, TrendingUp, Package, Clock, CheckCircle, IndianRupee, Plus, ArrowRight, Building2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const FarmerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/farmers/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load farmer dashboard:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex"><Sidebar /><div className="flex-1"><Loading /></div></div>;

  const chartData = [
    { month: 'May', earnings: (data?.earnings || 50000) * 0.4 },
    { month: 'Jun', earnings: (data?.earnings || 50000) * 0.6 },
    { month: 'Jul', earnings: (data?.earnings || 50000) * 0.8 },
    { month: 'Aug', earnings: (data?.earnings || 50000) * 0.9 },
    { month: 'Sep', earnings: data?.earnings || 50000 },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        {/* Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-agri-900 to-agri-800 text-white p-6 rounded-3xl shadow-md">
          <div>
            <span className="text-xs font-bold text-agri-300 uppercase tracking-widest block">Farmer Workspace</span>
            <h1 className="text-2xl font-black">Welcome Back, Farmer Partner! 🌾</h1>
            <p className="text-xs text-slate-300 mt-1">Manage produce listings, fulfill FPO purchase requests & track revenue.</p>
          </div>
          <Link
            to="/farmer/add-produce"
            className="px-4 py-2.5 bg-agri-500 hover:bg-agri-600 text-slate-950 font-bold text-xs rounded-xl shadow inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Produce Listing
          </Link>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Listings</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900">{data?.totalListings || 0}</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"><Package className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Active Orders</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-600">{data?.activeOrders || 0}</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl"><Clock className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Pending Requests</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-blue-600">{data?.pendingOrders || 0}</span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl"><Sprout className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Completed Orders</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-700">{data?.completedOrders || 0}</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"><CheckCircle className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Earnings</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-agri-800">₹{data?.earnings?.toLocaleString('en-IN') || '0'}</span>
              <div className="p-2 bg-agri-100 text-agri-800 rounded-xl"><IndianRupee className="w-5 h-5" /></div>
            </div>
          </div>
        </div>

        {/* Charts & FPO Demand Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-agri-600" /> Revenue & Sales Overview
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Earnings']} />
                  <Bar dataKey="earnings" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Nearby FPO Procurement Requirements */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" /> FPO Demand Requirements
              </h3>
              <Link to="/marketplace" className="text-xs font-bold text-agri-700 hover:underline">View All</Link>
            </div>

            <div className="space-y-3">
              {data?.fpoDemands && data.fpoDemands.length > 0 ? (
                data.fpoDemands.map((fpoReq) => (
                  <div key={fpoReq._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{fpoReq.cropName}</span>
                      <span className="text-agri-700">₹{fpoReq.targetPrice}/{fpoReq.unit}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Req: <strong>{fpoReq.requiredQuantity?.toLocaleString()} {fpoReq.unit}</strong> | FPO: {fpoReq.requester?.name}
                    </p>
                    <Link
                      to={`/marketplace`}
                      className="text-[11px] font-bold text-agri-700 hover:underline inline-block pt-1"
                    >
                      Respond with Produce Offer $\rightarrow$
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No active FPO demands found nearby.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Produce Listings Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">My Active Produce Listings</h3>
            <Link to="/farmer/add-produce" className="text-xs font-bold text-agri-700 hover:underline">+ New Crop</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3">Crop Name</th>
                  <th className="p-3">Variety</th>
                  <th className="p-3">Available Quantity</th>
                  <th className="p-3">Expected Price</th>
                  <th className="p-3">Quality</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentListings && data.recentListings.length > 0 ? (
                  data.recentListings.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{p.cropName}</td>
                      <td className="p-3 text-slate-600">{p.variety}</td>
                      <td className="p-3 font-bold text-agri-800">{p.availableQuantity?.toLocaleString()} {p.unit}</td>
                      <td className="p-3 font-semibold text-slate-800">₹{p.expectedPrice}/{p.unit}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">{p.qualityGrade}</span></td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400">No produce listings yet. Click 'Add Produce Listing' to start selling!</td>
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

export default FarmerDashboard;
