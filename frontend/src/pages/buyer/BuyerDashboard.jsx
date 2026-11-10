import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import OrderCard from '../../components/OrderCard';
import StatusBadge from '../../components/StatusBadge';
import API from '../../services/api';
import { ShoppingCart, Plus, Building2, CheckCircle, IndianRupee, ArrowRight } from 'lucide-react';

const BuyerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/buyers/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load buyer dashboard:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex"><Sidebar /><div className="flex-1"><Loading /></div></div>;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        {/* Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white p-6 rounded-3xl shadow-md">
          <div>
            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest block">Buyer Workspace</span>
            <h1 className="text-2xl font-black">Bulk Buyer Purchasing Center 🛒</h1>
            <p className="text-xs text-slate-300 mt-1">Post high-volume crop demand, receive FPO supply offers & track shipments.</p>
          </div>
          <Link
            to="/buyer/create-demand"
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-slate-950 font-bold text-xs rounded-xl shadow inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Bulk Demand
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Active Demands</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-blue-600">{data?.activeDemands || 0}</span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl"><Building2 className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Active Contracts</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-600">{data?.activeOrders || 0}</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl"><ShoppingCart className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Completed Fulfilled</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-600">{data?.completedOrders || 0}</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"><CheckCircle className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Procurement Expenditure</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-slate-900">₹{data?.totalSpent?.toLocaleString('en-IN') || '0'}</span>
              <div className="p-2 bg-slate-100 text-slate-700 rounded-xl"><IndianRupee className="w-5 h-5" /></div>
            </div>
          </div>
        </div>

        {/* Active Bulk Buyer Requirements & Received FPO Offers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">My Bulk Demands & FPO Offers</h3>
            <Link to="/buyer/create-demand" className="text-xs font-bold text-blue-600 hover:underline">+ New Requirement</Link>
          </div>

          <div className="space-y-4">
            {data?.recentDemands && data.recentDemands.length > 0 ? (
              data.recentDemands.map((demand) => (
                <div key={demand._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase">{demand.cropName} Requirement</span>
                      <h4 className="text-base font-black text-slate-900">
                        {demand.requiredQuantity?.toLocaleString()} {demand.unit} @ ₹{demand.targetPrice}/{demand.unit}
                      </h4>
                    </div>
                    <StatusBadge status={demand.status} />
                  </div>

                  <p className="text-xs text-slate-600">{demand.description}</p>

                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-2">
                      FPO Responses ({demand.responses?.length || 0} Offers Received):
                    </span>
                    {demand.responses && demand.responses.length > 0 ? (
                      <div className="space-y-2">
                        {demand.responses.map((resp, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 text-xs">{resp.responder?.name || 'FPO Supplier'}</span>
                              <p className="text-[11px] text-slate-500">
                                Offered: {resp.offeredQuantity?.toLocaleString()} {demand.unit} @ ₹{resp.pricePerUnit}/{demand.unit}
                              </p>
                            </div>
                            <StatusBadge status={resp.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No FPO offers submitted yet for this requirement.</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No bulk demands posted yet. Click 'Create Bulk Demand' to issue requirements.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuyerDashboard;
