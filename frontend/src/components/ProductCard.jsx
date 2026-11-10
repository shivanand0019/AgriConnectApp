import React from 'react';
import { MapPin, Calendar, Award, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ProductCard = ({ produce, onAction, actionLabel = 'Send Request' }) => {
  const defaultImg = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Image & Badges */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={produce.images && produce.images[0] ? produce.images[0] : defaultImg}
          alt={produce.cropName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-xs font-bold text-slate-800 shadow-sm border border-white">
            {produce.qualityGrade || 'Grade A'}
          </span>
          <StatusBadge status={produce.status} />
        </div>
        <div className="absolute bottom-3 right-3 px-3 py-1 bg-agri-900/85 backdrop-blur-md rounded-lg text-white font-extrabold text-sm shadow">
          ₹{produce.expectedPrice} / {produce.unit || 'kg'}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-agri-700 transition-colors">
              {produce.cropName}
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              {produce.variety || 'Native'}
            </span>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mb-4">
            {produce.description || 'Fresh quality produce listed directly by verified Karnataka farmer.'}
          </p>

          <div className="space-y-2 text-xs text-slate-600 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-agri-600 shrink-0" />
              <span>
                {produce.location?.city || 'Mysuru'}, {produce.location?.district || 'Mysuru'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Farmer: <strong className="text-slate-800">{produce.farmer?.name || 'Local Farmer'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Harvest: {new Date(produce.harvestDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer & Quantity Lock Specs */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Available</span>
            <span className="text-sm font-extrabold text-agri-800">
              {produce.availableQuantity?.toLocaleString()} {produce.unit || 'kg'}
            </span>
          </div>

          <button
            onClick={() => onAction && onAction(produce)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white font-semibold text-xs rounded-xl shadow hover:shadow-md transition-all active:scale-95"
          >
            {actionLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
