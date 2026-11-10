import React from 'react';
import { Package, User, Calendar, MapPin, CheckCircle, XCircle, Truck } from 'lucide-react';
import StatusBadge from './StatusBadge';

const OrderCard = ({ order, onStatusUpdate, onRequestShipment }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-mono font-bold text-slate-400">ORDER NO</span>
          <h4 className="text-base font-extrabold text-slate-900">{order.orderNumber}</h4>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-1">Crop & Volume</span>
          <p className="font-bold text-slate-800 text-sm">{order.cropName}</p>
          <p className="text-slate-600">
            {order.quantity?.toLocaleString()} {order.unit} @ ₹{order.pricePerUnit}/{order.unit}
          </p>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Counterpart</span>
          <p className="font-semibold text-slate-800 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-agri-600" />
            Buyer: {order.buyer?.name || 'Buyer'}
          </p>
          <p className="text-slate-600 flex items-center gap-1 mt-0.5">
            <User className="w-3.5 h-3.5 text-amber-600" />
            Seller: {order.seller?.name || 'Seller'}
          </p>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Total Valuation</span>
          <p className="font-extrabold text-agri-700 text-base">
            ₹{order.totalAmount?.toLocaleString('en-IN')}
          </p>
          <p className="text-slate-500 text-[11px] flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>Delivery: {order.deliveryAddress?.city || 'Bengaluru'}</span>
        </div>

        <div className="flex items-center gap-2">
          {order.status === 'PENDING' && onStatusUpdate && (
            <>
              <button
                onClick={() => onStatusUpdate(order._id, 'ACCEPTED')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Accept Order
              </button>
              <button
                onClick={() => onStatusUpdate(order._id, 'REJECTED')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg border border-rose-200 inline-flex items-center gap-1 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}

          {order.status === 'ACCEPTED' && onRequestShipment && (
            <button
              onClick={() => onRequestShipment(order)}
              className="px-3.5 py-1.5 bg-agri-700 hover:bg-agri-800 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 shadow transition-colors"
            >
              <Truck className="w-3.5 h-3.5" /> Request Logistics Shipment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
