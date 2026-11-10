import React from 'react';
import { Truck, MapPin, Calendar, Clock, Navigation, CheckCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ShipmentCard = ({ shipment, onStatusUpdate, showControls = false }) => {
  const nextStatuses = {
    REQUESTED: 'ACCEPTED',
    ACCEPTED: 'PICKUP_SCHEDULED',
    PICKUP_SCHEDULED: 'PICKED_UP',
    PICKED_UP: 'IN_TRANSIT',
    IN_TRANSIT: 'DELIVERED',
  };

  const nextStatus = nextStatuses[shipment.status];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-mono font-bold text-slate-400">SHIPMENT ID</span>
          <h4 className="text-base font-extrabold text-slate-900">{shipment.shipmentNumber}</h4>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-1">Route & Distance</span>
          <p className="font-bold text-slate-800 flex items-center gap-1 text-sm">
            <MapPin className="w-4 h-4 text-agri-600 shrink-0" />
            {shipment.pickupLocation?.city} $\rightarrow$ {shipment.deliveryLocation?.city}
          </p>
          <p className="text-slate-500 mt-0.5">{shipment.distanceKm} km ($\sim$ ₹{shipment.totalCost?.toLocaleString('en-IN')})</p>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Cargo Details</span>
          <p className="font-semibold text-slate-800">
            {shipment.cargoDetails?.cropName || shipment.order?.cropName}
          </p>
          <p className="text-slate-500">
            {shipment.cargoDetails?.quantityKg?.toLocaleString() || shipment.order?.quantity?.toLocaleString()} kg
          </p>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Assigned Partner / Vehicle</span>
          <p className="font-semibold text-slate-800 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            {shipment.logisticsPartner?.name || 'Unassigned (Open Marketplace)'}
          </p>
          <p className="text-slate-500">
            {shipment.vehicle ? `${shipment.vehicle.vehicleType} (${shipment.vehicle.registrationNumber})` : 'Vehicle pending'}
          </p>
        </div>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="pt-3 border-t border-slate-100">
        <span className="text-[11px] font-bold text-slate-400 uppercase block mb-2">Live Shipment Status</span>
        <div className="flex items-center justify-between text-[11px] text-slate-500 relative">
          <div className="absolute top-2 left-2 right-2 h-0.5 bg-slate-200 -z-0"></div>
          {['REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].map((st, idx) => {
            const isCompleted = ['REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].indexOf(shipment.status) >= idx;
            const isCurrent = shipment.status === st;

            return (
              <div key={st} className="flex flex-col items-center z-10 bg-white px-1">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                    isCurrent
                      ? 'bg-agri-600 text-white ring-4 ring-agri-100 scale-110'
                      : isCompleted
                      ? 'bg-agri-700 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`mt-1 font-semibold text-[10px] hidden sm:block ${isCurrent ? 'text-agri-800 font-extrabold' : 'text-slate-400'}`}>
                  {st.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Controls for Logistics Partner */}
      {showControls && nextStatus && onStatusUpdate && (
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => onStatusUpdate(shipment._id, nextStatus)}
            className="px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-1.5 transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            Advance to: {nextStatus.replace(/_/g, ' ')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShipmentCard;
