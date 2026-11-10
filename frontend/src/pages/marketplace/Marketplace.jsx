import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { fetchProduces } from '../../services/produceService';
import { fetchProcurements, respondToProcurement } from '../../services/procurementService';
import { createOrder } from '../../services/orderService';
import { useAuth } from '../../hooks/useAuth';
import { Search, Filter, Sprout, Building2, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';

const Marketplace = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('PRODUCE'); // PRODUCE, FPO_DEMANDS, BUYER_DEMANDS
  const [produces, setProduces] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [crop, setCrop] = useState('');
  const [location, setLocation] = useState('');
  const [quality, setQuality] = useState('');

  // Modal State for Ordering / Responding
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null); // 'ORDER_PRODUCE', 'RESPOND_DEMAND'
  const [orderQuantity, setOrderQuantity] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [note, setNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'PRODUCE') {
        const res = await fetchProduces({ crop, location, quality });
        if (res.success) setProduces(res.data);
      } else {
        const role = activeTab === 'FPO_DEMANDS' ? 'FPO' : 'BUYER';
        const res = await fetchProcurements({ crop, location, role });
        if (res.success) setProcurements(res.data);
      }
    } catch (err) {
      console.error('Marketplace fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, [activeTab, crop, location, quality]);

  const handleOpenOrderModal = (item) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedItem(item);
    setOrderQuantity(item.minOrderQuantity || 100);
    setOfferedPrice(item.expectedPrice || item.targetPrice || 25);
    setModalType('ORDER_PRODUCE');
  };

  const handleOpenRespondModal = (demand) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedItem(demand);
    setOrderQuantity(demand.requiredQuantity || 1000);
    setOfferedPrice(demand.targetPrice || 25);
    setModalType('RESPOND_DEMAND');
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    setActionSuccess('');
    try {
      if (modalType === 'ORDER_PRODUCE') {
        // Create Purchase Order
        const isFPO = user?.role === 'FPO';
        await createOrder({
          sellerId: selectedItem.farmer._id || selectedItem.farmer,
          produceId: selectedItem._id,
          cropName: selectedItem.cropName,
          quantity: Number(orderQuantity),
          unit: selectedItem.unit || 'kg',
          pricePerUnit: Number(offeredPrice),
          orderType: isFPO ? 'FPO_FARMER' : 'BUYER_FPO',
          deliveryAddress: user?.location,
        });
        setActionSuccess('Purchase order created successfully! Available inventory updated.');
      } else if (modalType === 'RESPOND_DEMAND') {
        // Respond to Procurement Demand
        await respondToProcurement(selectedItem._id, {
          offeredQuantity: Number(orderQuantity),
          pricePerUnit: Number(offeredPrice),
          note,
        });
        setActionSuccess('Supply offer submitted to requester successfully!');
      }

      setTimeout(() => {
        setModalType(null);
        setActionSuccess('');
        loadMarketplaceData();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-[calc(100vh-12rem)]">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="px-3 py-1 bg-agri-100 text-agri-800 text-xs font-bold rounded-full border border-agri-200">
          🌾 Direct Agricultural Exchange
        </span>
        <h1 className="text-3xl font-black text-slate-900">AgriConnect Open Marketplace</h1>
        <p className="text-xs text-slate-600">
          Discover farmer produce listings, FPO procurement requirements, and bulk buyer contract demands across Karnataka.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center border-b border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('PRODUCE')}
            className={`pb-3 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'PRODUCE'
                ? 'border-agri-600 text-agri-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sprout className="w-4 h-4" /> Farmer Produce Listings
          </button>
          <button
            onClick={() => setActiveTab('FPO_DEMANDS')}
            className={`pb-3 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'FPO_DEMANDS'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" /> FPO Purchase Reqs
          </button>
          <button
            onClick={() => setActiveTab('BUYER_DEMANDS')}
            className={`pb-3 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'BUYER_DEMANDS'
                ? 'border-blue-600 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Bulk Buyer Demands
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder="Search crop (e.g. Tomato, Onion, Ragi)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
          />
        </div>

        <div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g. Mysuru, Mandya)..."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
          />
        </div>

        <div>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
          >
            <option value="">All Quality Grades</option>
            <option value="Grade A">Grade A</option>
            <option value="Grade B">Grade B</option>
            <option value="Organic Premium">Organic Premium</option>
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-medium text-xs">Loading Marketplace Exchange Items...</div>
      ) : activeTab === 'PRODUCE' ? (
        produces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {produces.map((p) => (
              <ProductCard
                key={p._id}
                produce={p}
                actionLabel="Create Purchase Order"
                onAction={handleOpenOrderModal}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">No produce listings found matching your search.</div>
        )
      ) : (
        /* Procurement Requirements / Demands Grid */
        procurements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {procurements.map((req) => (
              <div key={req._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase">{req.requesterRole} PROCUREMENT</span>
                    <StatusBadge status={req.status} />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">{req.cropName} Requirement</h3>
                    <p className="text-xs font-bold text-agri-800">
                      Target: {req.requiredQuantity?.toLocaleString()} {req.unit} @ ₹{req.targetPrice}/{req.unit}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600">{req.description}</p>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Requester: <strong>{req.requester?.name || 'Agri Partner'}</strong> ({req.location?.city})</p>
                    <p>Deadline: {new Date(req.deadline).toLocaleDateString('en-IN')}</p>
                    <p>Fulfilled: {req.fulfilledQuantity?.toLocaleString()} / {req.requiredQuantity?.toLocaleString()} {req.unit}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleOpenRespondModal(req)}
                    className="px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-1.5 transition-all"
                  >
                    Respond with Supply Offer <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">No procurement requirements found.</div>
        )
      )}

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={modalType === 'ORDER_PRODUCE' ? `Order Produce: ${selectedItem?.cropName}` : `Supply Offer for ${selectedItem?.cropName}`}
      >
        {actionSuccess ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 text-base">{actionSuccess}</h4>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleConfirmAction}>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedItem?.cropName} ({selectedItem?.qualityGrade || 'Grade A'})</p>
              <p className="text-slate-600">
                Location: {selectedItem?.location?.city} | Seller/Requester: {selectedItem?.farmer?.name || selectedItem?.requester?.name}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity ({selectedItem?.unit || 'kg'})</label>
              <input
                type="number"
                required
                min="1"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price per Unit (₹)</label>
              <input
                type="number"
                required
                min="1"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>

            {modalType === 'RESPOND_DEMAND' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Offer Note / Delivery Terms</label>
                <textarea
                  rows="2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Ready for pickup at Mysuru APMC yard on Oct 12..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
                ></textarea>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow"
              >
                Confirm & Submit
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Marketplace;
