import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  Users,
  Layers,
  Truck,
  FileText,
  MessageSquare,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const getRoleLinks = () => {
    switch (user.role) {
      case 'FARMER':
        return [
          { to: '/farmer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/farmer/produce', label: 'My Produce Listings', icon: Package },
          { to: '/farmer/add-produce', label: 'Add Produce', icon: PlusCircle },
          { to: '/farmer/orders', label: 'Purchase Orders', icon: ShoppingCart },
          { to: '/marketplace', label: 'FPO & Buyer Demands', icon: Layers },
          { to: '/messages', label: 'Messages & Inquiries', icon: MessageSquare },
        ];
      case 'FPO':
        return [
          { to: '/fpo/dashboard', label: 'FPO Overview', icon: LayoutDashboard },
          { to: '/fpo/procurement', label: 'Procurement Reqs', icon: PlusCircle },
          { to: '/fpo/inventory', label: 'Aggregated Stock', icon: Layers },
          { to: '/fpo/orders', label: 'Buyer & Farmer Orders', icon: ShoppingCart },
          { to: '/marketplace', label: 'Produce Marketplace', icon: Package },
          { to: '/messages', label: 'Negotiations', icon: MessageSquare },
        ];
      case 'BUYER':
        return [
          { to: '/buyer/dashboard', label: 'Buyer Dashboard', icon: LayoutDashboard },
          { to: '/buyer/create-demand', label: 'Post Bulk Demand', icon: PlusCircle },
          { to: '/buyer/orders', label: 'My Contracts & Orders', icon: ShoppingCart },
          { to: '/marketplace', label: 'Browse FPO & Produce', icon: Package },
          { to: '/messages', label: 'FPO Messages', icon: MessageSquare },
        ];
      case 'LOGISTICS':
        return [
          { to: '/logistics/dashboard', label: 'Logistics Center', icon: LayoutDashboard },
          { to: '/logistics/vehicles', label: 'Fleet Management', icon: Truck },
          { to: '/logistics/shipments', label: 'Shipments Marketplace', icon: FileText },
          { to: '/messages', label: 'Driver Communication', icon: MessageSquare },
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Platform Oversight', icon: LayoutDashboard },
          { to: '/marketplace', label: 'All Listings', icon: Package },
          { to: '/messages', label: 'System Logs', icon: MessageSquare },
        ];
      default:
        return [];
    }
  };

  const links = getRoleLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div>
        {/* User Card */}
        <div className="p-3 mb-6 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3">
          <img
            src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
            alt={user.name}
            className="w-10 h-10 rounded-lg object-cover border border-slate-600"
          />
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
            <span className="text-[10px] font-semibold text-agri-400 block uppercase tracking-wider">{user.role}</span>
          </div>
        </div>

        {/* Links Navigation */}
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider px-3 mb-2 block">
            Navigation Menu
          </span>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-agri-600 text-white shadow-md'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Role Footer */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-agri-500" />
          <span>Verified AgriConnect Partner</span>
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
