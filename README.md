# 🌾 AgriConnect - Full-Stack MERN Agricultural Supply Chain Platform

> **From Farm to Market. Better Connections. Better Opportunities.**  
> A production-style MERN (MongoDB, Express.js, React, Node.js) web platform connecting **Farmers**, **FPOs (Farmer Producer Organizations)**, **Large Bulk Buyers**, and **Logistics Partners** into a transparent, direct agricultural supply network.

---

## 🚀 Key Features & Capabilities

### 1. 🌾 Farmer Module
- **Account & Profile Management**: Register farm location, acres, soil type, and primary crops.
- **Produce Listing Management**: Publish crop name, variety, quantity, expected price (₹/unit), minimum order quantity, harvest date, quality grade, images, and location.
- **Farmer Dashboard**: Metrics for active listings, incoming purchase orders, earnings, and nearby FPO/Buyer demands.
- **Direct Offers**: Respond to FPO procurement requirements or receive direct purchase orders.

### 2. 🏢 FPO (Farmer Producer Organization) Module
- **Procurement Requirements**: Issue bulk crop demands (e.g., *10,000 kg Tomatoes @ ₹25/kg in Mysuru by Oct 15*).
- **Multi-Farmer Produce Aggregation**: Automatically aggregate produce from multiple farmers (*1,000 kg from Farmer A + 2,000 kg from Farmer B + 1,500 kg from Farmer C = 4,500 kg total FPO Inventory*).
- **FPO Inventory Hub**: Track total, available, and reserved crop quantities with source farmer traceability.
- **Bulk Buyer Contracts**: Fulfill 50-Ton contracts with food processing companies and supermarket chains.

### 3. 🛒 Large Buyer Module
- **Bulk Demand Generator**: Food processing companies, exporters, and supermarkets post high-volume demand specs (*50,000 kg Onions @ ₹32/kg for Bengaluru delivery by Oct 20*).
- **FPO Offer Comparison**: Compare FPO supply offers and accept direct purchase contracts.
- **Order & Shipment Tracking**: Track order status, escrow payment status, and live logistics dispatch.

### 4. 🚚 Logistics Partner Module
- **Fleet & Vehicle Registration**: Register trucks (10-Ton Container, 5-Ton Eicher, 2-Ton Pickup, Refrigerated 8-Ton), driver info, and pricing per km.
- **Logistics Marketplace**: View open shipment dispatch requests from FPOs and Buyers.
- **Interactive Tracking & Stepper**: Update shipment status (`REQUESTED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PICKUP_SCHEDULED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `DELIVERED`).
- **Interactive Leaflet Maps**: Real-time visual route mapping between origin APMC/Farm and destination delivery city.

### 5. 🛡️ Admin Module
- Overall platform analytics, user verification toggles, trade volume auditing, and role distribution metrics.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons, Recharts, Leaflet / React-Leaflet |
| **Backend** | Node.js, Express.js, REST APIs, JWT (JSON Web Tokens), bcryptjs, Morgan |
| **Database** | MongoDB, Mongoose ODM |
| **Architecture** | Controllers, Routes, Models, Middleware, Services, Configuration, Validation, Error Handling |

---

## 📁 Folder Structure

```
agriconnect/
├── backend/
│   ├── config/
│   │   ├── config.env
│   │   └── database.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── buyerController.js
│   │   ├── farmerController.js
│   │   ├── fpoController.js
│   │   ├── logisticsController.js
│   │   ├── messageController.js
│   │   ├── notificationController.js
│   │   ├── orderController.js
│   │   ├── procurementController.js
│   │   ├── produceController.js
│   │   └── shipmentController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   ├── BuyerProfile.js
│   │   ├── FarmerProfile.js
│   │   ├── FPOInventory.js
│   │   ├── FPOProfile.js
│   │   ├── LogisticsProfile.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Payment.js
│   │   ├── ProcurementRequest.js
│   │   ├── Produce.js
│   │   ├── PurchaseOrder.js
│   │   ├── Review.js
│   │   ├── Shipment.js
│   │   ├── User.js
│   │   └── Vehicle.js
│   ├── routes/
│   │   └── [12 route files]
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── seedData.js
│   ├── app.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Footer.jsx
    │   │   ├── Loading.jsx
    │   │   ├── MapView.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── OrderCard.jsx
    │   │   ├── ProductCard.jsx
    │   │   ├── ShipmentCard.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── StatusBadge.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   └── useAuth.js
    │   ├── pages/
    │   │   ├── admin/AdminDashboard.jsx
    │   │   ├── auth/Login.jsx & Register.jsx
    │   │   ├── buyer/BuyerDashboard.jsx & CreateDemand.jsx
    │   │   ├── farmer/FarmerDashboard.jsx & AddProduce.jsx
    │   │   ├── fpo/FPODashboard.jsx & Procurement.jsx
    │   │   ├── logistics/LogisticsDashboard.jsx
    │   │   ├── marketplace/Marketplace.jsx
    │   │   ├── Home.jsx
    │   │   └── Messages.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   └── [service clients]
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🔑 Pre-Configured Demo Accounts

For fast testing and presentation, all demo accounts use password: `password123`.  
You can also use the **"⚡ Switch Role Demo"** dropdown in the top navbar to switch roles in 1 click!

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Farmer** | Ramesh Gowda | `farmer@agriconnect.com` | `password123` |
| **FPO** | Mysuru Farmers Producer Co. | `fpo@agriconnect.com` | `password123` |
| **Large Buyer** | FreshToHome Foods Corp | `buyer@agriconnect.com` | `password123` |
| **Logistics** | GreenExpress Logistics | `logistics@agriconnect.com` | `password123` |
| **Admin** | System Administrator | `admin@agriconnect.com` | `password123` |

---

## ⚡ Installation & Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally (`mongodb://localhost:27017/agriconnect`) OR a MongoDB Atlas URI.

### 2. Backend Setup
```bash
cd backend
npm install
```

Ensure `backend/config/config.env` is configured:
```env
PORT=8080
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/agriconnect
JWT_SECRET=agriconnect_super_secret_jwt_key_2026_production_grade
JWT_EXPIRE=7d
```

### 3. Seed Database with Realistic Data
Populate 10 farmers, 3 FPOs, 3 buyers, 3 logistics, 20 listings, 10 requirements, 10 purchase orders, vehicles, and active shipments:
```bash
npm run seed
```

### 4. Start Backend Server
```bash
npm run dev
# Server will start on http://localhost:8080
```

### 5. Frontend Setup & Run
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Vite dev server will start on http://localhost:3000
```

---

## 📡 REST API Overview

```http
POST /api/auth/register          # Register user
POST /api/auth/login             # Authenticate user & get JWT token
GET  /api/auth/me                # Fetch authenticated profile

GET  /api/produce                # Search & filter marketplace produces
POST /api/produce                # Create produce listing (FARMER)

GET  /api/procurement            # Search FPO & Buyer procurement requirements
POST /api/procurement            # Create requirement (FPO / BUYER)
POST /api/procurement/:id/respond# Respond with supply offer

POST /api/orders                 # Create purchase order (locks quantity)
GET  /api/orders                 # Fetch user orders
PUT  /api/orders/:id/status      # Update order status & aggregate FPO inventory

POST /api/shipments              # Request shipment transport for order
GET  /api/shipments              # Fetch shipments
PUT  /api/shipments/:id/status   # Advance shipment timeline (LOGISTICS)

# 🎙️ Gnani AI Multilingual Voice Assistant Endpoints
GET  /api/ai/status              # Query AI models (Prisma, Evon, Timbre) & DEMO/LIVE mode
POST /api/ai/transcribe          # Transcribe audio using Gnani Prisma STT (Kannada, Hindi, etc.)
POST /api/ai/chat                # Reasoning & intent action with Gnani Evon 30B LLM
POST /api/ai/speak               # Convert response text to speech using Gnani Timbre TTS
POST /api/ai/voice-conversation  # End-to-end voice turn (Audio In -> STT -> Evon -> Action -> TTS)
POST /api/ai/clear-history       # Clear session conversation memory
```

---

## 🎙️ Gnani AI Multilingual Voice Assistant Architecture

AgriConnect integrates three sovereign Indian AI models from Gnani.ai:

1. **Gnani Prisma v2.5 / v3.0 (Speech-to-Text)**:
   - Real-time speech recognition for Kannada (`kn-IN`), Hindi (`hi-IN`), Indian English (`en-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), and code-mixed speech.
   - Microphone streaming with real-time waveform level monitoring and transcription preview before execution.

2. **Gnani Evon v3.3 (30B Hybrid Mamba-MoE Reasoning LLM)**:
   - Official Model: `gnani/gnani-evon-v3.3-30B-A3B`
   - Orchestrates agricultural supply-chain reasoning, farmer assistance, buyer matching, FPO aggregation, and order queries.
   - Structured action outputs strictly validated on the backend with authorization and confirmation gates.

3. **Gnani Timbre v2.5 (Text-to-Speech)**:
   - Generates natural, authentic regional voices (`Chaitra`, `Chetan`, `Nalini`, `Kabir`, `Pooja`).
   - Integrated with playback controls (Play, Pause, Replay, Stop).

### Configuration & Demo Mode

Configure keys in `backend/config/config.env`:
```env
AI_DEMO_MODE=true                # Set to false once live API credentials are added
GNANI_API_KEY=your_key_here     # Vachana API key for Prisma & Timbre
GNANI_API_BASE_URL=https://api.vachana.ai
EVON_API_BASE_URL=https://api-inference.huggingface.co/models/gnani/gnani-evon-v3.3-30B-A3B
EVON_API_KEY=your_hf_key_here
EVON_MODEL=gnani/gnani-evon-v3.3-30B-A3B
```
If credentials are not yet entered, AgriConnect automatically operates in transparent **DEMO MODE** with full feature availability without breaking or failing.

---

## 🔮 Future Enhancements
1. Real-time WebSockets streaming for live speech transcription chunking.
2. Integration with Razorpay / UPI payment gateways.
3. Automated AI crop price forecasting based on APMC historical data.
