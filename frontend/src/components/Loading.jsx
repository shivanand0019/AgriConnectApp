import React from 'react';

const Loading = ({ text = 'Loading AgriConnect Data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-12 h-12 border-4 border-agri-200 border-t-agri-600 rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-600 animate-pulse">{text}</p>
    </div>
  );
};

export default Loading;
