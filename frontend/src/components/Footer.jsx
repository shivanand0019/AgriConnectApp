import React from 'react';
import { Sprout, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-extrabold text-lg">
            <Sprout className="w-6 h-6 text-agri-500" />
            <span>AgriConnect</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Eliminating unnecessary middlemen and creating direct transparent linkages between Farmers, FPOs, Large Bulk Buyers, and Logistics Partners across Karnataka and India.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Supply Chain Roles</h4>
          <ul className="space-y-2">
            <li><a href="/marketplace" className="hover:text-agri-400">Farmers Marketplace</a></li>
            <li><a href="/marketplace" className="hover:text-agri-400">FPO Procurement Directory</a></li>
            <li><a href="/marketplace" className="hover:text-agri-400">Large Buyer Demand Specs</a></li>
            <li><a href="/marketplace" className="hover:text-agri-400">Logistics Transport Fleet</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Regional Hubs</h4>
          <ul className="space-y-2">
            <li>Mysuru APMC Hub & Warehousing</li>
            <li>Mandya Sugarcane & Paddy Federation</li>
            <li>Hassan Multi-Crop Logistics Center</li>
            <li>Bengaluru Yeshwanthpur Distribution</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm mb-1">Farmer Helpline</h4>
          <p className="flex items-center gap-2 text-slate-300 font-bold">
            <Phone className="w-4 h-4 text-agri-500" /> +91 1800-AGRI-CONNECT
          </p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-agri-500" /> support@agriconnect.org
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-agri-500" /> Mysuru & Bengaluru, Karnataka
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between text-slate-500 gap-4">
        <p>© 2026 AgriConnect Platform. Production MERN Agricultural Supply Chain Architecture.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-400">Privacy Policy</a>
          <a href="#" className="hover:text-slate-400">Terms of Service</a>
          <a href="#" className="hover:text-slate-400">APMC Regulations</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
