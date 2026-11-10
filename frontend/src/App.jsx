import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Marketplace from './pages/marketplace/Marketplace';
import ProduceDetails from './pages/marketplace/ProduceDetails';
import ProcurementDetails from './pages/marketplace/ProcurementDetails';

// Role Dashboards & Workflows
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import AddProduce from './pages/farmer/AddProduce';
import MyProduce from './pages/farmer/MyProduce';
import FarmerOrders from './pages/farmer/FarmerOrders';

import FPODashboard from './pages/fpo/FPODashboard';
import Procurement from './pages/fpo/Procurement';
import Inventory from './pages/fpo/Inventory';
import FPOOrders from './pages/fpo/FPOOrders';

import BuyerDashboard from './pages/buyer/BuyerDashboard';
import CreateDemand from './pages/buyer/CreateDemand';
import BuyerOrders from './pages/buyer/BuyerOrders';

import LogisticsDashboard from './pages/logistics/LogisticsDashboard';
import VehicleManagement from './pages/logistics/VehicleManagement';
import Shipments from './pages/logistics/Shipments';

import AdminDashboard from './pages/admin/AdminDashboard';
import Messages from './pages/Messages';
import AssistantPage from './pages/assistant/AssistantPage';

// Voice Assistant Components
import FloatingVoiceButton from './components/voice/FloatingVoiceButton';
import VoiceAssistantDrawer from './components/voice/VoiceAssistantDrawer';

const RoleDashboardRedirect = () => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'FARMER': return <Navigate to="/farmer/dashboard" replace />;
    case 'FPO': return <Navigate to="/fpo/dashboard" replace />;
    case 'BUYER': return <Navigate to="/buyer/dashboard" replace />;
    case 'LOGISTICS': return <Navigate to="/logistics/dashboard" replace />;
    case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
    default: return <Navigate to="/" replace />;
  }
};

function App() {
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = React.useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 relative">
          <Navbar onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)} />
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/produce/:id" element={<ProduceDetails />} />
              <Route path="/procurement/:id" element={<ProcurementDetails />} />
              <Route path="/dashboard" element={<RoleDashboardRedirect />} />

              {/* Farmer Routes */}
              <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer/add-produce" element={<AddProduce />} />
              <Route path="/farmer/produce" element={<MyProduce />} />
              <Route path="/farmer/orders" element={<FarmerOrders />} />

              {/* FPO Routes */}
              <Route path="/fpo/dashboard" element={<FPODashboard />} />
              <Route path="/fpo/procurement" element={<Procurement />} />
              <Route path="/fpo/inventory" element={<Inventory />} />
              <Route path="/fpo/orders" element={<FPOOrders />} />

              {/* Buyer Routes */}
              <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
              <Route path="/buyer/create-demand" element={<CreateDemand />} />
              <Route path="/buyer/orders" element={<BuyerOrders />} />

              {/* Logistics Routes */}
              <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
              <Route path="/logistics/vehicles" element={<VehicleManagement />} />
              <Route path="/logistics/shipments" element={<Shipments />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Shared Routes */}
              <Route path="/messages" element={<Messages />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />

          {/* Global Floating AI Voice Assistant Button & Drawer */}
          <FloatingVoiceButton
            isOpen={isVoiceAssistantOpen}
            onClick={() => setIsVoiceAssistantOpen((prev) => !prev)}
          />
          <VoiceAssistantDrawer
            isOpen={isVoiceAssistantOpen}
            onClose={() => setIsVoiceAssistantOpen(false)}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
