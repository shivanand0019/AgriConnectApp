import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Loading from '../../components/Loading';
import API from '../../services/api';
import Modal from '../../components/Modal';
import { Layers, Plus, Users, Package, CheckCircle2 } from 'lucide-react';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [cropName, setCropName] = useState('Tomato');
  const [variety, setVariety] = useState('Grade A Roma');
  const [totalQuantity, setTotalQuantity] = useState('5000');
  const [qualityGrade, setQualityGrade] = useState('Grade A');

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/fpo/inventory');
      if (res.data.success) {
        setInventory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await API.post('/fpo/inventory', {
        cropName,
        variety,
        totalQuantity: Number(totalQuantity),
        qualityGrade,
      });
      setShowAddModal(false);
      loadInventory();
    } catch (err) {
      alert(err.message || 'Failed to add inventory');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-agri-100 text-agri-800 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Aggregated FPO Inventory</h1>
              <p className="text-xs text-slate-500">Track multi-farmer crop stock and reserved buyer allocations</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Manual Batch Stock
          </button>
        </div>

        {loading ? (
          <Loading text="Loading FPO aggregated inventory..." />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <div key={item._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FPO CROP STOCK</span>
                        <h3 className="text-lg font-black text-slate-900">{item.cropName}</h3>
                        <span className="text-xs text-slate-500 font-semibold">{item.variety}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-agri-100 text-agri-800 font-bold text-xs rounded-full">
                        {item.qualityGrade || 'Grade A'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Volume:</span>
                        <strong className="text-slate-900 font-extrabold">{item.totalQuantity?.toLocaleString()} {item.unit}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available Stock:</span>
                        <strong className="text-agri-800 font-extrabold">{item.availableQuantity?.toLocaleString()} {item.unit}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reserved for Buyer:</span>
                        <strong className="text-amber-700 font-bold">{item.reservedQuantity?.toLocaleString() || 0} {item.unit}</strong>
                      </div>
                    </div>

                    <div className="pt-2 text-xs space-y-1">
                      <span className="font-bold text-slate-700 block mb-1">
                        Supplying Farmers ({item.sourceFarmers?.length || 0}):
                      </span>
                      {item.sourceFarmers && item.sourceFarmers.length > 0 ? (
                        item.sourceFarmers.map((sf, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-100">
                            <span>{sf.farmerName || 'Farmer Partner'}</span>
                            <span className="font-bold">{sf.quantity?.toLocaleString()} {item.unit}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No detailed farmer breakdown.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 text-xs text-slate-400">
                  No aggregated inventory stock yet. FPO purchases from farmers will populate here automatically.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal for manual batch add */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Stock to FPO Inventory"
        >
          <form className="space-y-4" onSubmit={handleAddStock}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Crop Name</label>
              <input
                type="text"
                required
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Variety</label>
              <input
                type="text"
                required
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Batch Quantity (kg)</label>
              <input
                type="number"
                required
                min="1"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
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
                className="px-5 py-2 bg-agri-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Add Inventory
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default Inventory;
