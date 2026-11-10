import React from 'react';

const StatusBadge = ({ status }) => {
  const getColors = (st) => {
    switch (st) {
      case 'AVAILABLE':
      case 'ACCEPTED':
      case 'PAID':
      case 'DELIVERED':
      case 'COMPLETED':
      case 'FULFILLED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PENDING':
      case 'REQUESTED':
      case 'OPEN':
      case 'PARTIALLY_SOLD':
      case 'PARTIALLY_FULFILLED':
      case 'PICKUP_SCHEDULED':
      case 'IN_TRANSIT':
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'REJECTED':
      case 'CANCELLED':
      case 'SOLD_OUT':
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors(status)}`}>
      {status ? status.replace(/_/g, ' ') : 'N/A'}
    </span>
  );
};

export default StatusBadge;
