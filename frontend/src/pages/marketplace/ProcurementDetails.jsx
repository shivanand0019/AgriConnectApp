import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { fetchProcurementById, respondToProcurement } from '../../services/procurementService';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Building2, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

const ProcurementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [procurement, setProcurement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offeredQuantity, setOfferedQuantity] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const res = await fetchProcurementById(id);
        if (res.success) {
          setProcurement(res.data);
          setOfferedQuantity(res.data.requiredQuantity || 1000);
          setOfferedPrice(res.data.targetPrice || 25);
        }
      } catch (err) {
        console.error('Failed to load procurement details:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await respondToProcurement(id, {
        offeredQuantity: Number(offeredQuantity),
        pricePerUnit: Number(offeredPrice),
        note,
      });

      setSuccessMsg('Supply offer submitted to requester successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading procurement requirement details..." />;
  if (!procurement) return <div className="p-8 text-center text-slate-500">Procurement requirement not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">{procurement.requesterRole} PROCUREMENT SPEC</span>
            <h1 className="text-2xl font-black text-slate-900">{procurement.cropName} Requirement</h1>
            <p className="text-xs text-slate-500">Issued by {procurement.requester?.name || 'Agri Partner'}</p>
          </div>
          <StatusBadge status={procurement.status} />
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Required Volume</span>
            <strong className="text-slate-900 font-extrabold text-sm">{procurement.requiredQuantity?.toLocaleString()} {procurement.unit}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Target Price</span>
            <strong className="text-agri-800 font-extrabold text-sm">₹{procurement.targetPrice} / {procurement.unit}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Quality Grade</span>
            <strong className="text-slate-800 font-bold">{procurement.qualityGrade}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Deadline</span>
            <span className="font-semibold text-slate-700">{new Date(procurement.deadline).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-1">Requirement Notes & Terms</h4>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">{procurement.description}</p>
        </div>

        {/* Form to submit supply offer */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Submit Supply Offer</h3>

          {successMsg ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleRespond}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Offered Quantity ({procurement.unit})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={offeredQuantity}
                    onChange={(e) => setOfferedQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price per Unit (₹)</label>
                  <input
                    type="number"
                    required
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery / Pickup Note</label>
                <textarea
                  rows="2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Ready for pickup at Mysuru APMC yard on Oct 12..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                {submitting ? 'Submitting Supply Offer...' : 'Submit Supply Offer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcurementDetails;
