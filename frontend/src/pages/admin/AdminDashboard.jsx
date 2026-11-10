import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import API from '../../services/api';
import { Shield, Users, ShoppingCart, Truck, CheckCircle2, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleVerify = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/verify`);
      fetchStats();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex"><Sidebar /><div className="flex-1"><Loading /></div></div>;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        {/* Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-agri-950 text-white p-6 rounded-3xl shadow-md">
          <div>
            <span className="text-xs font-bold text-agri-400 uppercase tracking-widest block">System Administration</span>
            <h1 className="text-2xl font-black">AgriConnect Platform Management 🛡️</h1>
            <p className="text-xs text-slate-300 mt-1">Audit transactions, verify agricultural partners & inspect platform throughput.</p>
          </div>
        </div>

        {/* System Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Registered Users</span>
            <span className="text-2xl font-black text-slate-900">{data?.totalUsers || 0}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Produce Traded</span>
            <span className="text-2xl font-black text-emerald-700">{data?.totalQuantityKg?.toLocaleString() || 0} kg</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Purchase Orders</span>
            <span className="text-2xl font-black text-blue-600">{data?.totalOrders || 0}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Platform Volume</span>
            <span className="text-xl font-black text-agri-800">₹{data?.totalVolumeTraded?.toLocaleString('en-IN') || 0}</span>
          </div>
        </div>

        {/* User Accounts Management & Verification Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">User Account Verification & Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentUsers && data.recentUsers.length > 0 ? (
                  data.recentUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold">{u.role}</span>
                      </td>
                      <td className="p-3 text-slate-600">{u.location?.city}</td>
                      <td className="p-3">
                        {u.isVerified ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Unverified
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleVerify(u._id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors"
                        >
                          Toggle Verification
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="p-6 text-center text-slate-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
