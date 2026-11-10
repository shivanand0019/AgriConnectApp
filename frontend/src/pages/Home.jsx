import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Sprout,
  ArrowRight,
  TrendingUp,
  Truck,
  ShieldCheck,
  Building2,
  ShoppingCart,
  Users,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async (email) => {
    await switchDemoRole(email);
    navigate('/dashboard');
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION WITH REAL FARMING LAND BACKGROUND & 3D OVERLAYS */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-24 pb-28 px-4 sm:px-6 lg:px-8">
        {/* Real Farming Land High-Res Background Image with Dark Vignette Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80"
            alt="Real Farming Land Landscape"
            className="w-full h-full object-cover opacity-35 scale-105 animate-pulse duration-[10000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-slate-950/90"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-agri-500/20 border border-agri-400/30 text-agri-300 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg">
              <Sparkles className="w-4 h-4 text-agri-400 animate-spin" /> Direct Farm-to-Market Network
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight drop-shadow-lg">
              From Farm to Market. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-agri-300 via-amber-300 to-emerald-200">
                Better Connections. Better Opportunities.
              </span>
            </h1>

            <p className="text-slate-200 text-base sm:text-lg max-w-xl leading-relaxed drop-shadow">
              Connect farmers, FPOs, large bulk buyers, and logistics partners in one transparent, middleman-free agricultural supply chain powered by interactive supply chain workflows.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/marketplace"
                className="px-7 py-4 bg-gradient-to-r from-agri-500 to-emerald-600 hover:from-agri-600 hover:to-emerald-700 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-agri-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Explore Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleDemoClick('farmer@agriconnect.com')}
                className="px-7 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/25 font-bold text-sm rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Sell Produce (Farmer Demo)
              </button>
            </div>
          </div>

          {/* Visual Supply Chain Card */}
          <div className="perspective-1000">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 card-3d">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sprout className="w-6 h-6 text-agri-400" />
                  <span>Karnataka Supply Chain Flow</span>
                </h3>
                <span className="text-[11px] font-extrabold px-3 py-1 bg-agri-500/20 text-agri-300 rounded-full border border-agri-400/40">
                  Live Network
                </span>
              </div>

              {/* Visual Supply Chain Flowchart with Real Farming Photos */}
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3.5 bg-white/10 rounded-2xl border border-white/10 hover:border-agri-400/50 transition-all">
                  <img
                    src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=150&q=80"
                    alt="Farmer harvest"
                    className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">1. Farmers (Mysuru, Mandya, Hassan)</h4>
                    <p className="text-xs text-slate-300">Harvest & list quality tomatoes, onions, ragi, turmeric</p>
                  </div>
                </div>

                <div className="text-center text-agri-400 text-xs font-bold uppercase tracking-widest">↓ FPO Aggregation</div>

                <div className="flex items-center gap-4 p-3.5 bg-white/10 rounded-2xl border border-white/10 hover:border-amber-400/50 transition-all">
                  <img
                    src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=150&q=80"
                    alt="FPO Facility"
                    className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">2. FPOs (Farmer Producer Orgs)</h4>
                    <p className="text-xs text-slate-300">Consolidate multi-farmer crops into bulk 50-Ton stock</p>
                  </div>
                </div>

                <div className="text-center text-agri-400 text-xs font-bold uppercase tracking-widest">↓ Bulk Contracts</div>

                <div className="flex items-center gap-4 p-3.5 bg-white/10 rounded-2xl border border-white/10 hover:border-blue-400/50 transition-all">
                  <img
                    src="https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=150&q=80"
                    alt="Buyer Distribution"
                    className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">3. Large Buyers & Exporters</h4>
                    <p className="text-xs text-slate-300">Supermarket chains contract direct bulk volume</p>
                  </div>
                </div>

                <div className="text-center text-agri-400 text-xs font-bold uppercase tracking-widest">↓ GPS Dispatch</div>

                <div className="flex items-center gap-4 p-3.5 bg-white/10 rounded-2xl border border-white/10 hover:border-purple-400/50 transition-all">
                  <img
                    src="https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&w=150&q=80"
                    alt="Tractor & Logistics"
                    className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">4. Logistics Partners</h4>
                    <p className="text-xs text-slate-300">Dispatched 10-Ton trucks with live GPS route status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DEMO ROLE SELECTOR WITH REAL FARMING LAND BACKDROPS & 3D TILT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-agri-700 uppercase tracking-widest bg-agri-100 px-3 py-1 rounded-full">
            Interactive Role Hub
          </span>
          <h2 className="text-3xl font-black text-slate-900">Experience All 4 Roles Instantly</h2>
          <p className="text-xs text-slate-600">Click any role below to launch into its pre-seeded dashboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            onClick={() => handleDemoClick('farmer@agriconnect.com')}
            className="relative bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group card-3d"
          >
            <div className="h-32 w-full relative">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80"
                alt="Farmer Farmland"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <span className="absolute bottom-3 left-4 text-2xl">🌾</span>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-agri-700 transition-colors">Farmer Portal</h3>
              <p className="text-xs text-slate-500">List crops, discover FPO demand, view earnings & orders.</p>
              <span className="text-xs font-extrabold text-agri-700 flex items-center gap-1 pt-2">Demo as Ramesh Gowda $\rightarrow$</span>
            </div>
          </div>

          <div
            onClick={() => handleDemoClick('fpo@agriconnect.com')}
            className="relative bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group card-3d-amber"
          >
            <div className="h-32 w-full relative">
              <img
                src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80"
                alt="FPO Facility"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <span className="absolute bottom-3 left-4 text-2xl">🏢</span>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-700 transition-colors">FPO Hub</h3>
              <p className="text-xs text-slate-500">Aggregate multi-farmer stock, fulfill buyer contracts.</p>
              <span className="text-xs font-extrabold text-amber-700 flex items-center gap-1 pt-2">Demo Mysuru FPO $\rightarrow$</span>
            </div>
          </div>

          <div
            onClick={() => handleDemoClick('buyer@agriconnect.com')}
            className="relative bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group card-3d-blue"
          >
            <div className="h-32 w-full relative">
              <img
                src="https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80"
                alt="Buyer Supply Chain"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <span className="absolute bottom-3 left-4 text-2xl">🛒</span>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors">Large Buyer</h3>
              <p className="text-xs text-slate-500">Post 50-Ton bulk demands, compare FPO offers & track shipment.</p>
              <span className="text-xs font-extrabold text-blue-700 flex items-center gap-1 pt-2">Demo FreshToHome $\rightarrow$</span>
            </div>
          </div>

          <div
            onClick={() => handleDemoClick('logistics@agriconnect.com')}
            className="relative bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group card-3d-purple"
          >
            <div className="h-32 w-full relative">
              <img
                src="https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&w=600&q=80"
                alt="Tractor Logistics"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <span className="absolute bottom-3 left-4 text-2xl">🚚</span>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-700 transition-colors">Logistics Partner</h3>
              <p className="text-xs text-slate-500">Manage fleet trucks, accept shipments & update live tracking.</p>
              <span className="text-xs font-extrabold text-purple-700 flex items-center gap-1 pt-2">Demo GreenExpress $\rightarrow$</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM STATISTICS */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1920&q=80"
          alt="Farmland background"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <span className="text-3xl sm:text-4xl font-black text-agri-400">10,000+ kg</span>
            <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">Produce Traded</span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-amber-400">250+</span>
            <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">Farmers Connected</span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-blue-400">100%</span>
            <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">Transparent Pricing</span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-purple-400">₹0</span>
            <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">Middleman Commission</span>
          </div>
        </div>
      </section>

      {/* 4. FAQs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-2xl font-black text-slate-900 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1">How does produce aggregation work for FPOs?</h4>
            <p className="text-xs text-slate-600">
              FPOs accept produce orders from multiple local farmers (e.g. 1,000kg from Farmer A + 2,000kg from Farmer B). AgriConnect automatically aggregates these quantities into unified FPO Inventory stock available for large buyer contracts.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1">How is over-ordering prevented?</h4>
            <p className="text-xs text-slate-600">
              Our backend order engine enforces strict quantity validation. Whenever an order is created, the available produce quantity is locked and decremented automatically.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
