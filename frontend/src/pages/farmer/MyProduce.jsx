import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { fetchProduces, deleteProduce } from '../../services/produceService';
import { useAuth } from '../../hooks/useAuth';
import { Package, Plus, Trash2, Edit3, ArrowLeft, AlertCircle } from 'lucide-react';

const MyProduce = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [produces, setProduces] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyProduces = async () => {
    setLoading(true);
    try {
      const res = await fetchProduces();
      if (res.success) {
        // Filter produces for current farmer
        const myItems = res.data.filter((p) => p.farmer?._id === user?._id || p.farmer === user?._id);
        setProduces(myItems);
      }
    } catch (err) {
      console.error('Failed to load farmer produce:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadMyProduces();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this produce listing?')) {
      try {
        await deleteProduce(id);
        loadMyProduces();
      } catch (err) {
        alert(err.message || 'Failed to delete listing');
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">My Listed Produce</h1>
              <p className="text-xs text-slate-500">Manage your active crop listings, quantities, and prices</p>
            </div>
          </div>
          <Link
            to="/farmer/add-produce"
            className="px-4 py-2.5 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Produce Listing
          </Link>
        </div>

        {loading ? (
          <Loading text="Loading your produce listings..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produces.length > 0 ? (
              produces.map((p) => (
                <div key={p._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="relative h-44 bg-slate-100">
                    <img
                      src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'}
                      alt={p.cropName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-900/85 backdrop-blur-md rounded-lg text-white font-extrabold text-xs">
                      ₹{p.expectedPrice} / {p.unit}
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-base font-black text-slate-900">{p.cropName}</h3>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">{p.qualityGrade}</span>
                      </div>
                      <p className="text-slate-500 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                      <div className="flex justify-between">
                        <span>Available Quantity:</span>
                        <strong className="text-agri-800 font-extrabold">{p.availableQuantity?.toLocaleString()} {p.unit}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Harvested:</span>
                        <span className="font-semibold">{p.quantity?.toLocaleString()} {p.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-semibold">{p.location?.city}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to={`/produce/${p._id}`}
                        className="text-agri-700 font-bold hover:underline"
                      >
                        View Full Details $\rightarrow$
                      </Link>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Produce Listings Found</h3>
                <p className="text-xs text-slate-500">Click below to publish your first crop listing on the marketplace.</p>
                <Link
                  to="/farmer/add-produce"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-agri-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  <Plus className="w-4 h-4" /> Create Produce Listing
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyProduce;
